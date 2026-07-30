# ADR-001: Technology Stack Selection

**Date:** 2026-06-27
**Status:** Accepted
**Deciders:** Principal Architect, Tech Lead

---

## Context

We are building a Cricket Tournament Management & Live Auction Platform — a real-time SaaS
application requiring:
- Sub-second auction bid processing under concurrent load
- Live WebSocket broadcasts to 50+ clients simultaneously
- Tamper-evident audit logging
- Role-based access for 6 distinct roles

---

## Decision

### Backend

| Concern | Choice | Rationale |
|---|---|---|
| Web framework | FastAPI 0.115 | Async-native, automatic OpenAPI, Pydantic v2 integration |
| Runtime | Python 3.13 | Latest stable; free-threaded GIL (PEP 703) future-ready |
| Database ODM | Beanie 1.27 | First-class Pydantic v2 support; Pythonic over raw Motor |
| Database driver | Motor 3.6 | Async MongoDB driver underlying Beanie |
| Database | MongoDB 7.0 | Flexible document model for nested cricket entities; native aggregation for statistics |
| Cache / Broker | Redis 7.2 | Captain sessions (opaque tokens), rate limiting, Celery broker |
| Task queue | Celery 5.4 | Background jobs: report generation, email delivery |
| Auth | PyJWT 2.10 | Pure Python, no native extensions, Python 3.13 compatible |
| Password hashing | passlib + bcrypt | Industry standard; compatible with multe hash schemes |
| Logging | structlog 24 | JSON-structured logs with contextvars integration |

### Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Mature ecosystem; concurrent rendering for auction timer UI |
| Language | TypeScript 5.7 | Type safety prevents API contract drift |
| Build tool | Vite 6 | Sub-second HMR; ES module native |
| Styling | TailwindCSS 3.4 | Utility-first; consistent design tokens |
| Server state | TanStack Query 5 | Cache invalidation on WebSocket events; background refetch |
| HTTP client | Axios 1.7 | Interceptor support for token refresh |
| Forms | React Hook Form 7 + Zod | Performant form state + runtime schema validation |
| Animation | Framer Motion 11 | Auction timer animations, bid feed transitions |

### Infrastructure

| Concern | Choice | Rationale |
|---|---|---|
| Containerisation | Docker + Docker Compose | Consistent dev/prod parity |
| CI | GitHub Actions | Native GitHub integration; free for public repos |
| Linting | Ruff (Python), ESLint (TS) | Ruff replaces 8 tools; ESLint standard for TS |
| Formatting | Black (Python), Prettier (TS) | Zero-config; no style debates |
| Type checking | mypy --strict (Python), tsc --strict (TS) | Catch errors before runtime |

---

## Consequences

- **Positive:** Async-native stack eliminates thread-blocking during WebSocket broadcasts; Beanie
  simplifies document operations while preserving raw Motor access for optimistic-lock atomicity.
- **Negative:** Beanie async patterns have steeper learning curve than synchronous ORMs;
  Python 3.13 may have transitive dependency issues with older packages.
- **Mitigation:** All packages pinned in requirements.txt; Docker build validates dependency
  resolution in CI.
