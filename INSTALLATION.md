# Installation Guide

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.13.0 | `python --version` |
| pip | 24.x | `pip --version` |
| Node.js | 22.x | `node --version` |
| npm | 10.x | `npm --version` |
| MongoDB | 7.0 | `mongod --version` |
| Redis | 7.x | `redis-server --version` |
| Docker | 27.x | `docker --version` (optional) |
| Docker Compose | 2.x | `docker compose version` (optional) |

---

## Option A: Docker Compose

The fastest path — everything in containers.

```bash
# Clone
git clone <repo-url> cricket-platform
cd cricket-platform

# Configure
cp backend/.env.example backend/.env
# Open backend/.env and set:
#   JWT_SECRET_KEY=<random 64-char string>
#   SUPER_ADMIN_PASSWORD=<secure password>

cp frontend/.env.example frontend/.env.local

# Start
docker-compose up

# Verify
curl http://localhost:8000/api/v1/health
```

---

## Option B: Manual Setup

### 1. Start MongoDB and Redis

```bash
# MongoDB
mongod --dbpath /path/to/data --port 27017

# Redis
redis-server
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements-dev.txt

# Configure
cp .env.example .env
# Edit .env with your values

# Start the server
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL: `http://localhost:8000`
API Docs: `http://localhost:8000/api/v1/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure
cp .env.example .env.local

# Start dev server
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## Verify the Installation

```bash
# Health check
curl -s http://localhost:8000/api/v1/health | python -m json.tool

# Expected output:
# {
#   "status": "healthy",
#   "app": "Cricket Tournament Platform",
#   "version": "0.1.0",
#   "environment": "development",
#   "dependencies": {
#     "mongodb": "ok",
#     "redis": "ok"
#   }
# }
```

---

## Run Tests

```bash
cd backend

# Unit tests only
pytest tests/unit -v

# Integration tests (requires MongoDB + Redis)
pytest tests/integration -v

# Full suite with coverage
pytest --cov=app --cov-report=term-missing
```

---

## Run Linting

```bash
cd backend

# Ruff (lint + format check)
ruff check .
ruff format --check .

# Type checking
mypy app

# Security scan
bandit -r app -ll
```

```bash
cd frontend

# TypeScript
npm run type-check

# ESLint
npm run lint
```

---

## Pre-commit Hooks

```bash
# From project root
pip install pre-commit
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## Environment Variables Reference

See `backend/.env.example` for the full list with descriptions.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | Yes | `cricket_platform` | Database name |
| `REDIS_URL` | Yes | `redis://localhost:6379/0` | Redis connection string |
| `JWT_SECRET_KEY` | **Yes (prod)** | — | Must be ≥64 chars in production |
| `JWT_ALGORITHM` | No | `HS256` | `HS256` (dev) or `RS256` (prod) |
| `ENVIRONMENT` | No | `development` | `development`, `staging`, or `production` |
| `DEBUG` | No | `true` | Set `false` in production |
| `SUPER_ADMIN_EMAIL` | Yes | `admin@cricket.local` | Used by `scripts/create_admin.py` |
| `SUPER_ADMIN_PASSWORD` | **Yes (prod)** | — | Must be changed in production |
