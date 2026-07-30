# Cricket Tournament Platform

> Enterprise-grade Cricket Tournament Management & Live Auction Platform

A full-stack SaaS platform for managing cricket tournaments, running live player
auctions with real-time bidding, tracking match scores ball-by-ball, computing
statistics, and generating audit-grade reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI 0.115, Beanie 1.27 (MongoDB ODM) |
| Database | MongoDB 7.0 |
| Cache / Broker | Redis 7.2 |
| Background Jobs | Celery 5.4 |
| Frontend | React 18, TypeScript 5.7, Vite 6, TailwindCSS |
| Real-time | WebSocket (FastAPI native) |
| Auth | JWT RS256 (prod) / HS256 (dev) + Redis captain sessions |
| Logging | structlog (JSON in prod, coloured console in dev) |
| CI | GitHub Actions |
| Deployment | Docker + Docker Compose |

---

## Quick Start

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd cricket-platform

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — update JWT_SECRET_KEY and SUPER_ADMIN_PASSWORD

# 3. Configure frontend environment
cp frontend/.env.example frontend/.env.local

# 4. Start all services
docker-compose up

# 5. Verify
curl http://localhost:8000/api/v1/health     # backend
open http://localhost:5173                    # frontend
open http://localhost:8000/api/v1/docs        # OpenAPI docs (dev only)
```

### Option B — Local Development

See [INSTALLATION.md](INSTALLATION.md) for manual setup.

---

## Repository Structure

```
cricket-platform/
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── api/v1/              # Route handlers (Sprint 1+)
│   │   ├── config/              # DB + Redis connection managers
│   │   ├── core/                # Settings, security, constants
│   │   ├── dependencies/        # FastAPI dependency injectors
│   │   ├── exceptions/          # Exception hierarchy + handlers
│   │   ├── logging/             # structlog configuration
│   │   ├── middleware/          # Request ID, logging, rate limit
│   │   ├── repositories/        # Abstract + concrete repository layer
│   │   ├── services/            # Business logic layer
│   │   ├── utils/               # Helpers (datetime, pagination, response)
│   │   ├── websocket/           # WebSocket connection manager
│   │   └── worker/              # Celery application
│   ├── scripts/                 # Bootstrap + utility scripts
│   ├── tests/                   # pytest test suite
│   ├── main.py                  # Application factory
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pyproject.toml           # ruff, mypy, pytest config
│   └── Dockerfile
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── hooks/               # Custom React hooks (useWebSocket)
│   │   ├── lib/                 # Axios client, QueryClient
│   │   └── types/               # Shared TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml     # GitHub Actions CI pipeline
├── .pre-commit-config.yaml
├── docs/adr/                    # Architecture Decision Records
├── README.md
├── INSTALLATION.md
└── CONTRIBUTING.md
```

---

## Available Endpoints (Sprint 0)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Liveness + dependency readiness check |
| GET | `/api/v1/docs` | Swagger UI (dev only) |
| GET | `/api/v1/redoc` | ReDoc (dev only) |

Business endpoints are added in Sprint 1+.

---

## Sprint Progress

| Sprint | Status | Scope |
|---|---|---|
| Sprint 0 | ✅ Complete | Repository bootstrap, infrastructure, foundation |
| Sprint 1 | ⏳ Planned | Authentication, JWT, RBAC, captain sessions |
| Sprint 2 | ⏳ Planned | Tournament management |
| Sprint 3 | ⏳ Planned | Teams & Players |
| Sprint 4 | ⏳ Planned | Auction Engine core |
| Sprint 5 | ⏳ Planned | Auction advanced + WebSocket complete |
| Sprint 6 | ⏳ Planned | Match management + Standings |

---

## License

Proprietary — All rights reserved.
