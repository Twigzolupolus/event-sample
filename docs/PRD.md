# Product Requirements Document (PRD)
## Project: Event Board (Public + Single Admin)
**Version:** 1.0  
**Status:** Production-ready baseline  
**Date:** 2026-03-01

---

## 1) Executive Summary

Event Board is a lightweight event publishing and discovery web application with:
- A **public experience** for browsing event listings and event details
- A **single-admin back office** for creating/managing events
- A **simple auth model** (admin passcode + cookie session)
- SQLite + Prisma for fast local setup and reproducibility

The system is optimized for low operational overhead and rapid deployment.

---

## 2) Goals & Non-Goals

### 2.1 Goals
1. Allow visitors to browse published events.
2. Allow one admin to create/edit/publish/archive events.
3. Provide a secure-enough passcode-based admin login flow.
4. Support content workflows (draft/published, duplicate, regenerate code).
5. Keep setup reproducible with minimal dependencies.
6. Provide basic operational commands and local runbook.

### 2.2 Non-Goals
1. Multi-user admin roles/permissions.
2. Full RSVP/ticketing/payment workflow.
3. OAuth/social login.
4. Complex CMS/page-builder behavior.
5. Enterprise-scale analytics stack.

---

## 3) Users & Personas

### 3.1 Public User
- Wants to discover event information quickly.
- Reads event details and follows event links/code experiences.

### 3.2 Admin Operator (single account)
- Creates and manages event records.
- Publishes/unpublishes and duplicates events.
- Needs fast CRUD and reliable login/logout behavior.

---

## 4) Product Scope

### 4.1 Public Surface
- **Home page** listing published events.
- **Event detail pages** by slug.
- Additional public pages for join/success and experience flow.

### 4.2 Admin Surface
- `/admin/login` — passcode login
- `/admin` — events dashboard
- `/admin/new` — create event
- `/admin/[id]/edit` — edit event
- Admin tools for bulk operations and security settings

### 4.3 API Surface (Representative)
- `/api/admin/login`
- `/api/admin/logout`
- `/api/events` and event mutation endpoints
- analytics/category/search/view endpoints
- upload/join/subscribe/challenge endpoints (where implemented)

---

## 5) Functional Requirements

### FR-1: Admin Authentication
- Admin submits password to `/api/admin/login`.
- Successful login issues session cookie.
- Logout clears session cookie and returns success JSON.
- Client-side logout must redirect reliably to `/` (events home), independent of host redirect issues.

### FR-2: Admin Session Protection
- Admin pages and protected admin API endpoints require valid admin cookie.
- `/api/admin/login` must be excluded from pre-auth middleware blocking.
- CSRF/origin checks apply to protected mutations as appropriate.

### FR-3: Event CRUD
- Admin can create, update, delete, duplicate events.
- Event has status: `DRAFT` or `PUBLISHED`.
- Admin can toggle status.
- Admin can regenerate event code.

### FR-4: Event Listing & Filtering (Admin)
- Admin dashboard supports:
  - search (`q`)
  - status filter
  - category filter
  - sort options
  - pagination

### FR-5: Pagination
- Proper paging controls: First / Prev / numbered pages / Next / Last.
- Windowed page number display with ellipsis.
- Default page size = **10**.
- Optional page size choices: 10/20/50/100.

### FR-6: Event Row Visibility
- Admin event row must display:
  - title
  - category
  - status
  - event date
  - event code (if available)

### FR-7: Public Event Discovery
- Home should show publish-ready event data.
- Event detail route should resolve by slug.
- Published-only behavior for public visibility (where applicable).

### FR-8: Seed + Migration Workflow
- Local development supports deterministic migrate/seed/reset flows.
- `.env.example` must contain required env keys.

---

## 6) Data & Persistence Requirements

### 6.1 Database
- **Engine:** SQLite
- **ORM:** Prisma
- **Canonical DB file:** `prisma/dev.db`

### 6.2 DB Path Rule (Critical)
- Use `DATABASE_URL="file:./dev.db"`.
- Because schema is under `prisma/schema.prisma`, it resolves to `prisma/dev.db`.
- Do not use:
  - root `dev.db`
  - `prisma/prisma/dev.db`

### 6.3 Admin Credential
- Admin credential persisted in `AdminCredential` table (singleton row).
- Auth flow:
  - if DB credential exists → verify hashed password
  - else fallback to `ADMIN_PASSWORD` env for bootstrap

---

## 7) Security Requirements

1. No endpoint should return plaintext admin password.
2. Admin session cookie must be cleared on logout.
3. Middleware should protect admin routes and mutation APIs, while allowing login endpoint access.
4. CSRF/origin checks on sensitive write operations.
5. Temporary debug auth endpoints are allowed only during incident diagnosis and must be removed afterward.

---

## 8) UX Requirements

### 8.1 Admin Login
- Clear success/failure feedback.
- Failure should return `401 Unauthorized` JSON contract.

### 8.2 Admin Dashboard
- Fast bulk actions.
- Readable row metadata including date.
- Stable pagination and filter persistence via query params.

### 8.3 Logout
- Must always route user to `/` after logout.
- Must not depend on brittle server host redirect assumptions.

---

## 9) Technical Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19 + TypeScript
- **Backend:** Next.js Route Handlers (API routes)
- **ORM/DB:** Prisma + SQLite
- **Validation:** Zod
- **Styling:** Tailwind CSS 4
- **Linting:** ESLint (Next config)
- **Tooling:** Node.js + tsx (seed/dev scripts)

---

## 10) Operational Runbook (Required Commands)

### 10.1 First Setup
```bash
npm install --include=dev
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

### 10.2 Required `.env`
```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
ADMIN_COOKIE_SECRET="change-me-long-random-secret"
```

### 10.3 Daily Commands
```bash
npm run dev
npm run build
npm run db:migrate
npm run db:seed
```

### 10.4 Clean Reset
```bash
npx prisma migrate reset --force --skip-seed
npm run db:seed
npm run admin:reset
```

### 10.5 Login API Health Test
```bash
curl -i -X POST http://127.0.0.1:3000/api/admin/login \
  -H "Content-Type: application/json" \
  --data-raw '{"password":"change-me"}'
```

Expected: `HTTP 200` and body contains `{"ok":true}`.

---

## 11) Acceptance Criteria

### AC-Auth
- Valid admin password returns 200 from `/api/admin/login`.
- Invalid admin password returns 401 with `{"error":"Unauthorized"}`.
- Middleware does not block `/api/admin/login`.

### AC-Logout
- Logout clears cookie and redirects user to `/`.
- No localhost-refused redirect regression.

### AC-Admin List
- Default page size = 10.
- Pagination supports First/Prev/numbered/Next/Last.
- Event rows include date.

### AC-DB
- Canonical DB path is `prisma/dev.db`.
- Root `dev.db` and `prisma/prisma/dev.db` are not tracked/used.

### AC-Docs
- README includes setup, env, runbook commands, and stack summary.

---

## 12) Risks & Mitigations

- **Risk:** Env/path confusion causes auth failures  
  **Mitigation:** Canonical DB path documentation + ignore invalid DB artifacts.

- **Risk:** Middleware change blocks login  
  **Mitigation:** Explicit `/api/admin/login` allowlist + regression checks.

- **Risk:** Temporary debug endpoints remain in production  
  **Mitigation:** Cleanup PR policy and release checklist.

---

## 13) QA Checklist

1. `npm run build` passes.
2. Login success path works via curl and UI.
3. Invalid password returns 401.
4. Logout returns user to `/` without connection-refused.
5. Admin pagination works correctly.
6. Default page size is 10.
7. Event row date is visible.
8. DB resolves to `prisma/dev.db`.

---

## 14) Future Enhancements

1. Multi-admin user model with RBAC.
2. Password rotation UI + deeper audit trail.
3. Rich analytics dashboards.
4. Integration tests for middleware/auth.
5. Optional Postgres production profile.

---

## 15) Handoff Notes

This PRD is sufficient for another team to reproduce the current product behavior and architecture, including:
- auth behavior,
- admin dashboard UX (pagination/date/default size),
- logout UX behavior,
- canonical Prisma/SQLite workflow,
- and operational runbook requirements.

---

## 16) Detailed Feature Inventory (for Full Reproduction)

This section captures the project-specific details that go beyond a generic event CRUD app.

### 16.1 Admin Event Management (Detailed)
- Event create/edit forms include fields used across public + experience flows.
- Status workflow: draft vs published.
- Actions on event records include:
  - edit
  - duplicate
  - status updates
  - regenerate code
  - delete / bulk delete
- Admin list supports:
  - query search
  - status/category filters
  - sort
  - pagination
  - default page size 10
  - event row metadata includes date

### 16.2 Pending Approvals & Moderation Surface
- Dedicated admin approvals route: `/admin/approvals`.
- Challenge submissions have moderation endpoints:
  - approve: `/api/challenges/submissions/[id]/approve`
  - deny: `/api/challenges/submissions/[id]/deny`
- PRD consumers should implement a moderation queue UX and clear submission state transitions.

### 16.3 Challenges / Experience System
- Experience flow routes:
  - `/experience/[code]`
  - `/experience/[code]/brief`
  - `/experience/[code]/challenges`
  - `/experience/[code]/leaderboard`
- Challenge API surface exists for:
  - listing challenges
  - challenge detail
  - submission completion
- Reproduction should include:
  - challenge progression rules
  - submission model
  - leaderboard scoring/read model

### 16.4 Public UX + Journey
- Public pages include:
  - main event listing
  - event detail by slug
  - category-specific listing
  - join flow and success confirmation
- Analytics endpoints exist for user behavior signals:
  - view tracking
  - category interactions
  - search interactions

### 16.5 Uploads & Content Ops
- Upload API endpoint exists (`/api/uploads`) and should be part of deployment planning.
- RSS and sitemap endpoints are present and should be kept functional for discoverability/SEO.

### 16.6 Auth & Security Nuances (Important)
- Login endpoint must be middleware-allowlisted (`/api/admin/login`) or auth deadlocks occur.
- Logout should be client-driven redirect to avoid host mismatch issues.
- CSRF/origin checks must be applied to protected operations, but not in ways that block login flow.
- Temporary debug routes can be used for incidents, but must be removed after stabilization.

### 16.7 Operational Scripts & Backups
- Existing scripts include:
  - `db:migrate`
  - `db:seed`
  - `backup:db`
  - `admin:reset`
- Backup behavior should be documented with restore procedure in production handoff.

### 16.8 UI/UX Fixes to Preserve
- Admin logout must route to home page reliably.
- Admin table usability improvements (pagination window + defaults + date visibility) are required baseline behavior.
- Reproduction teams should treat these as regression-sensitive acceptance criteria.

### 16.9 “What to Include” Guidance
For faithful reproduction, include:
1. Core event CRUD and publishing workflow.
2. Admin auth/session behavior exactly as stabilized.
3. Challenges + submissions + approvals flow.
4. Experience pages and leaderboard behavior.
5. Analytics event ingestion endpoints.
6. Operational scripts and DB path conventions.
7. UX fixes already validated in this implementation.

