# Contributing Guide

## Development Workflow

1. **Pick a story** from the sprint backlog that meets the Definition of Ready
2. **Create a branch**: `feature/ESP-{id}-{short-slug}` from `develop`
3. **Implement** following the engineering standards below
4. **Run the full quality gate locally** before pushing
5. **Open a PR** to `develop` using the PR template
6. **Address review feedback**, then merge after 2 approvals

---

## Branch Naming

```
feature/ESP-{ticket-id}-{short-slug}   # new functionality
fix/ESP-{ticket-id}-{short-slug}       # bug fix
chore/ESP-{ticket-id}-{short-slug}     # non-functional (deps, config)
hotfix/ESP-{ticket-id}-{short-slug}    # production hotfix (branch from main)
```

---

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer: closes #ESP-xxx]
```

**Types:** `feat`, `fix`, `chore`, `test`, `docs`, `refactor`, `perf`, `ci`, `security`

**Examples:**
```
feat(auction): implement bid placement with idempotency enforcement
fix(auth): prevent refresh token reuse after rotation
test(security): add JWT tamper detection tests
security(middleware): enforce rate limiting on bid endpoint
```

---

## Local Quality Gate (run before every PR)

```bash
# Backend
cd backend
ruff check .                      # lint
ruff format --check .             # format check
mypy app                          # type check
bandit -r app -ll                 # security scan
pytest --cov=app                  # tests

# Frontend
cd frontend
npm run type-check                # TypeScript
npm run lint                      # ESLint
npm run build                     # Build verification
```

---

## Code Standards

### Python (Backend)

- **Type annotations** are mandatory on all public functions
- **mypy --strict** with zero errors (exceptions require `# type: ignore` + comment)
- No business logic in route handlers — delegate to the service layer
- No direct database calls outside repository classes
- All domain values come from `app.core.constants` — no string literals
- All datetimes are UTC-aware: use `app.utils.datetime.utcnow()`
- Request models: `model_config = ConfigDict(extra="ignore")`

### TypeScript (Frontend)

- TypeScript strict mode — no `any` (use `unknown` + type guards)
- API response types generated or matched against `src/types/index.ts`
- Functional components only — no class components
- Custom hooks for all WebSocket and complex async state

---

## PR Checklist

Every PR description must include:

- [ ] Story ticket reference: `Closes: ESP-xxx`
- [ ] PRD / ADD / DMD reference for the feature implemented
- [ ] All acceptance criteria verified by the author
- [ ] Unit tests written and passing
- [ ] Integration tests written for all new API endpoints
- [ ] No secrets in code or logs
- [ ] `CHANGELOG.md` entry added
- [ ] Deployed and smoke-tested on develop environment
- [ ] DoD checklist completed

---

## Definition of Done

A story is **Done** when ALL of the following pass:

- [ ] `mypy app` — zero errors
- [ ] `ruff check .` — zero warnings
- [ ] `pytest --cov=app --cov-fail-under=80` — green
- [ ] API contract matches ADD specification exactly
- [ ] Business rules match DMD exactly
- [ ] QA has verified acceptance criteria independently
- [ ] 2 code review approvals received
- [ ] No P0/P1 Sentry errors on develop

---

## Architecture Decision Records

Any new pattern, library, or database schema change requires an ADR filed in
`docs/adr/ADR-{number}-{title}.md`. Use ADR-001 as the template.

---

## Questions?

Open an issue or post in the #engineering Slack channel.
