/**
 * Generic WebSocket hook with automatic reconnection and exponential backoff.
 *
 * Sprint 0: connection infrastructure only.
 * Business-specific hooks (useAuctionSocket, useMatchSocket) are built on top
 * of this in Sprint 4+.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WsConnectionStatus, WsMessage } from '@/types'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000/api/v1'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1_000

interface UseWebSocketOptions<T> {
  /** Channel path, e.g. '/ws/auction/session-id' */
  path: string
  /** Called for every message received on the socket */
  onMessage: (msg: WsMessage<T>) => void
  /** Optional query parameters (e.g. captain_token) */
  params?: Record<string, string>
  /** Whether to connect immediately (default: true) */
  enabled?: boolean
}

interface UseWebSocketReturn {
  status: WsConnectionStatus
  send: (payload: unknown) => void
  disconnect: () => void
}

export function useWebSocket<T = unknown>({
  path,
  onMessage,
  params,
  enabled = true,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const buildUrl = useCallback(() => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return `${WS_BASE}${path}${query}`
  }, [path, params])

  const connect = useCallback(() => {
    if (!enabled) return

    setStatus('connecting')
    const url = buildUrl()
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      retryCountRef.current = 0
      setStatus('connected')
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WsMessage<T> = JSON.parse(event.data as string)
        onMessageRef.current(msg)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current)
        retryCountRef.current += 1
        setStatus('reconnecting')
        retryTimerRef.current = setTimeout(connect, delay)
      } else {
        setStatus('disconnected')
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [buildUrl, enabled])

  useEffect(() => {
    if (enabled) connect()
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect, enabled])

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryCountRef.current = MAX_RETRIES
    wsRef.current?.close()
    setStatus('disconnected')
  }, [])

  return { status, send, disconnect }
}
