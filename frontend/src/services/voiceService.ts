/**
 * VoiceAnnouncementService — Phase 2 premium live auction commentary engine.
 *
 * Architecture
 * ────────────
 * All clients receive the same WebSocket events from the backend, so each
 * client's browser TTS plays independently but in perfect logical sync.
 *
 * Queue item kinds
 * ─────────────────
 *  "speak"     — Standard priority (player intro, sold, unsold, paused/resumed)
 *  "bid"       — Replaceable: any new incoming bid drops the queued one so only
 *                the latest bid is ever announced when the current speech ends.
 *  "countdown" — Replaceable: newer countdown number drops the pending one.
 *                Suppressed while "speak" items are still in the queue.
 *  "delay"     — Silent pause (ms) between utterances.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type QueueItem =
  | { kind: "speak";     text: string }
  | { kind: "bid";       text: string }
  | { kind: "countdown"; text: string }
  | { kind: "delay";     ms:   number };

// ── Number → words ────────────────────────────────────────────────────────────

const _ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const _TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
               "Sixty", "Seventy", "Eighty", "Ninety"];

export function numberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n === 0)    return "Zero";
  if (n < 20)     return _ONES[n];
  if (n < 100)    return _TENS[Math.floor(n / 10)] + (n % 10 ? " " + _ONES[n % 10] : "");
  if (n < 1_000)  {
    const rem = n % 100;
    return _ONES[Math.floor(n / 100)] + " Hundred" + (rem ? " " + numberToWords(rem) : "");
  }
  const rem = n % 1_000;
  return numberToWords(Math.floor(n / 1_000)) + " Thousand" + (rem ? " " + numberToWords(rem) : "");
}

// ── Role description ──────────────────────────────────────────────────────────

const _BOWLING: Record<string, string> = {
  RIGHT_ARM_FAST:   "Right Arm Fast Bowler",
  RIGHT_ARM_MEDIUM: "Right Arm Medium Bowler",
  RIGHT_ARM_SPIN:   "Right Arm Spin Bowler",
  LEFT_ARM_FAST:    "Left Arm Fast Bowler",
  LEFT_ARM_MEDIUM:  "Left Arm Medium Bowler",
  LEFT_ARM_SPIN:    "Left Arm Spin Bowler",
};

export function describePlayerRole(
  role:         string,
  battingStyle: string | null,
  bowlingStyle: string | null,
): string {
  if (role === "ALL_ROUNDER")   return "All Rounder";
  if (role === "WICKET_KEEPER") return "Wicket Keeper Batsman";
  if (role === "BATSMAN") {
    if (battingStyle === "RIGHT_HAND") return "Right Hand Batsman";
    if (battingStyle === "LEFT_HAND")  return "Left Hand Batsman";
    return "Batsman";
  }
  if (role === "BOWLER") {
    return (bowlingStyle && _BOWLING[bowlingStyle]) || "Bowler";
  }
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Service ───────────────────────────────────────────────────────────────────

class VoiceAnnouncementService {
  private queue:   QueueItem[] = [];
  private busy     = false;
  private enabled  = true;
  private voice:   SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const load = () => { this.voice = this._pickVoice(); };
      window.speechSynthesis.onvoiceschanged = load;
      load();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Queue a sequence of speech and pauses atomically.
   * strings → TTS utterances | numbers → silent pause in ms
   *
   * Used for: player intro, sold/unsold sequences, paused, resumed.
   * These items are NEVER replaced by bids or countdowns.
   */
  announce(items: Array<string | number>): void {
    if (!this.enabled || !this._supported()) return;
    for (const item of items) {
      if (typeof item === "string") this.queue.push({ kind: "speak", text: item });
      else                          this.queue.push({ kind: "delay", ms: item });
    }
    this._flush();
  }

  /**
   * Queue a bid announcement.
   * Drops any PREVIOUSLY QUEUED (not-yet-spoken) bid so only the
   * latest bid is announced when the current speech ends.
   */
  speakBid(text: string): void {
    if (!this.enabled || !this._supported()) return;
    this.queue = this.queue.filter((i) => i.kind !== "bid");
    this.queue.push({ kind: "bid", text });
    this._flush();
  }

  /**
   * Queue a countdown announcement (30s milestone, 10s milestone, going-once,
   * going-twice, or single digit number).
   *
   * Rules:
   * - Drops any previously queued countdown (keeps only the latest).
   * - Silently suppressed while standard "speak" items are still pending
   *   (don't interrupt a player intro or sold sequence with a countdown).
   */
  speakCountdown(text: string): void {
    if (!this.enabled || !this._supported()) return;
    const hasMajorPending = this.queue.some((i) => i.kind === "speak");
    if (hasMajorPending) return;
    this.queue = this.queue.filter((i) => i.kind !== "countdown");
    this.queue.push({ kind: "countdown", text });
    this._flush();
  }

  /**
   * Remove all queued (non-playing) countdown items.
   * Called when a new bid resets the timer — cancels any pending
   * "Going once" / "Going twice" that is no longer relevant.
   */
  cancelCountdown(): void {
    this.queue = this.queue.filter((i) => i.kind !== "countdown");
  }

  /**
   * Remove all queued (non-playing) items.
   * Called on player_up to discard stale items from the previous player
   * before queuing the new player's introduction.
   * The currently-speaking utterance is NOT interrupted.
   */
  clearQueued(): void {
    this.queue = [];
  }

  /** Stop all speech immediately and clear the queue. */
  stop(): void {
    this.queue = [];
    this.busy  = false;
    if (this._supported()) window.speechSynthesis.cancel();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  get isEnabled(): boolean { return this.enabled; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private _flush(): void {
    if (!this.busy) this._next();
  }

  private _next(): void {
    if (this.queue.length === 0) { this.busy = false; return; }
    this.busy = true;
    const item = this.queue.shift()!;

    if (item.kind === "delay") {
      setTimeout(() => this._next(), item.ms);
      return;
    }

    const u    = new SpeechSynthesisUtterance(item.text);
    u.rate     = item.kind === "countdown" ? 1.1 : 1.0;  // countdown slightly crisper
    u.pitch    = 1.0;
    u.volume   = 1.0;
    if (this.voice) u.voice = this.voice;
    u.onend    = () => this._next();
    u.onerror  = () => this._next();   // never stall on error

    window.speechSynthesis.speak(u);
  }

  private _pickVoice(): SpeechSynthesisVoice | null {
    if (!this._supported()) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      // Prefer enhanced/natural English voices for best quality
      voices.find((v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Enhanced"))
      ) ??
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  }
}

export const voiceService = new VoiceAnnouncementService();
