# Technical Design Document (TDD)
## Project: Event Board
**Version:** 1.0  
**Date:** 2026-03-01  
**Companion to:** `docs/PRD.md`

---

## 1) Architecture Overview

Event Board is a Next.js App Router application with server route handlers used as the backend API layer.

- **Frontend:** React + TypeScript UI for public and admin surfaces.
- **Backend:** Next.js route handlers under `src/app/api/**`.
- **Persistence:** Prisma ORM with PostgreSQL (local + hosted environments).
- **Validation:** Zod at request boundaries where applicable.
- **Security model:** single-admin session cookie with middleware enforcement.

High-level flow:
1. Browser hits UI route.
2. UI fetches or mutates via internal API routes.
3. API routes validate/auth-check and execute Prisma operations.
4. Responses update UI state.

---

## 2) Code Organization

- `src/app/**` — App Router pages/layouts and API handlers.
- `src/app/api/**/route.ts` — backend endpoints.
- `src/components/**` — shared UI and admin components.
- `prisma/schema.prisma` — schema and datasource.
- `prisma/migrations/**` — migration history.
- `scripts/**` — operational scripts (seed/reset/backups).
- `docs/PRD.md` / `docs/TDD.md` — product + technical references.

---

## 3) Data Design

Database access is configured through environment-specific PostgreSQL `DATABASE_URL` values.

Core models (logical):
- Event
- AdminCredential (singleton)
- Challenge
- ChallengeSubmission
- Analytics records (logical capture)
- Join/subscribe records (logical capture)

Source of truth remains `prisma/schema.prisma`.

---

## 4) Authentication & Authorization Design

### 4.1 Login
- Endpoint: `POST /api/admin/login`
- Input: JSON password.
- Behavior:
  - verify against DB credential hash when present;
  - fallback to env bootstrap credential if needed.
- Output: session cookie + `{ "ok": true }` on success.

### 4.2 Middleware
- Middleware guards admin and protected mutation surfaces.
- Explicit allowlist includes `/api/admin/login` to prevent login deadlock.

### 4.3 Logout
- Endpoint clears cookie and returns JSON.
- Client triggers redirect to `/` to avoid host-based redirect mismatches.

---

## 5) API Design Principles

- Route handlers grouped by domain:
  - `admin`, `events`, `challenges`, `analytics`, `uploads`, `join`, `subscribe`.
- Mutation endpoints require admin auth where applicable.
- JSON contracts use predictable `ok/error` patterns.
- Keep endpoint inventory in PRD section 17 up to date.

---

## 6) Admin UX Technical Decisions

1. **Pagination quality baseline**
   - first/prev/numbered/next/last, windowed with ellipsis.
2. **Default page size**
   - fixed baseline default of 10 for dashboard usability.
3. **Row metadata completeness**
   - include event date along with category/status.
4. **Logout reliability**
   - client-side navigation after successful logout response.

---

## 7) Challenge & Moderation Design

- Challenge lifecycle endpoints support creation, update, and completion flows.
- Submission moderation endpoints support approve/deny actions.
- Admin approvals route acts as moderation queue surface.
- Experience pages consume challenge data and completion states.

---

## 8) Analytics & Growth Capture

- Event capture endpoints:
  - `/api/analytics/view`
  - `/api/analytics/category`
  - `/api/analytics/search`
- Growth endpoints:
  - `/api/join`
  - `/api/subscribe`
- Design intent: lightweight ingestion, low overhead, extensible later.

---

## 9) Operational Design

Required commands:
- `npm run db:migrate`
- `npm run db:seed`
- `npm run build`
- `npm run dev`

Operational endpoints/scripts:
- backup/reseed/audit/password-rotate APIs
- reset and seeding scripts for local reproducibility

---

## 10) Error Handling & Security Considerations

- Return explicit 401 for invalid admin auth.
- Never expose plaintext credentials in responses/logging.
- Apply origin/CSRF protections to sensitive mutations.
- Temporary debug routes must be removed post-incident.

---

## 11) Testing & Verification Strategy (Current Baseline)

- Build validation: `npm run build` must pass before merge.
- Auth smoke tests:
  - successful login path
  - invalid credential returns 401
  - logout clears cookie and returns user to `/`
- Admin UX checks:
  - pagination controls
  - default page size 10
  - row date visibility
- Data checks:
  - canonical DB path behavior and no duplicate tracked DB artifacts.

---

## 12) Tradeoffs and Deferred Engineering

- PostgreSQL chosen for local/cloud parity and deployment reliability.
- Single-admin model keeps auth simple; defer RBAC and multi-admin.
- Current test posture is pragmatic; deeper integration/e2e deferred.

---

## 13) Change Management Rules

1. Any endpoint change must update PRD endpoint inventory + traceability matrix.
2. Security-sensitive changes require explicit regression checks for login/logout/middleware.
3. DB environment variable configuration must remain consistent across preview/production.
4. Keep PRs small and merge only after build passes.

