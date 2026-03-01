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
- PostgreSQL + Prisma for reliable local/cloud parity and reproducibility

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
- **Engine:** PostgreSQL
- **ORM:** Prisma
- **Primary DB:** PostgreSQL (e.g., Neon / Vercel Postgres / Supabase)

### 6.2 DB URL Rule (Critical)
- Use a valid PostgreSQL `DATABASE_URL` in each environment.
- Keep credentials out of git; configure via environment variables only.
- Recommended providers: Neon / Vercel Postgres / Supabase.

### 6.3 Admin Credential

### 6.4 Hosting Recommendation
- Preferred hosting for current architecture: **Vercel** with Postgres.
- Cloudflare Pages with `next-on-pages` currently requires broad Edge-runtime refactoring for this app.

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
- **ORM/DB:** Prisma + PostgreSQL
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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
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
- Canonical DB configuration is via PostgreSQL `DATABASE_URL` per environment.

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
8. Database connectivity works via configured PostgreSQL `DATABASE_URL`.

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
- canonical Prisma/PostgreSQL workflow,
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


---

## 17) API Endpoint Inventory (Current Implementation)

This inventory reflects all current route handlers under `src/app/api/**`.

### 17.1 Admin
- `GET /api/admin/audit`
- `POST /api/admin/backup`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/reseed`
- `POST /api/admin/rotate-password`

### 17.2 Analytics
- `POST /api/analytics/category`
- `POST /api/analytics/search`
- `POST /api/analytics/view`

### 17.3 Challenges
- `POST /api/challenges`
- `PATCH /api/challenges/[id]`
- `POST /api/challenges/[id]/complete`
- `POST /api/challenges/submissions/[id]/approve`
- `POST /api/challenges/submissions/[id]/deny`

### 17.4 Events
- `POST /api/events`
- `GET /api/events/slug-check`
- `POST /api/events/bulk`
- `POST /api/events/bulk-delete`
- `PATCH /api/events/[id]`
- `DELETE /api/events/[id]`
- `POST /api/events/[id]/duplicate`
- `POST /api/events/[id]/regenerate-code`
- `POST /api/events/[id]/status`

### 17.5 Public Utility / Growth
- `POST /api/join`
- `POST /api/subscribe`
- `POST /api/uploads`

### 17.6 Documentation Rule
If any endpoint is added/removed/renamed, this section must be updated in the same PR.


---

## 18) Environment Matrix

| Variable | Development | Staging | Production | Required | Notes |
|---|---|---|---|---|---|
| `DATABASE_URL` | local Postgres URL | staging Postgres URL | production Postgres URL | Yes | Use provider URLs from Neon/Vercel Postgres/Supabase. SQLite allowed only for local prototype workflows. |
| `ADMIN_PASSWORD` | local passcode | staged secret | production secret | Yes | Used for first-login fallback if no DB credential exists. |
| `ADMIN_COOKIE_SECRET` | local random secret | staged secret | production secret | Yes | Session/cookie signing secret; keep long and random. |

Guidelines:
- Never commit real secrets.
- Keep `.env.example` as placeholders only.
- Rotate staging/prod secrets regularly.

---

## 19) Data Model Appendix (ERD-lite)

Primary entities (logical model):

- **Event**
  - Core fields: title, slug, category, date, status (`DRAFT`/`PUBLISHED`), eventCode, media/description fields.
  - Relationships: may own challenge records and related analytics events.

- **AdminCredential**
  - Singleton auth record (`id = singleton`), stores `passwordHash`.
  - Used when present; otherwise login can fallback to `ADMIN_PASSWORD` env.

- **Challenge**
  - Challenge metadata attached to an event/experience context.
  - Supports challenge lifecycle and completion operations.

- **ChallengeSubmission**
  - Submission records with moderation workflow.
  - States/actions: approve / deny via admin endpoints.

- **Analytics Events (logical)**
  - View/category/search tracking payloads captured by analytics endpoints.

- **Subscription/Join records (logical)**
  - Growth/engagement capture via `/api/subscribe` and `/api/join`.

Notes:
- Exact schema fields are source-of-truth in `prisma/schema.prisma`.
- Reproduction teams should generate DB diagrams directly from Prisma schema for implementation-level fidelity.

---

## 20) API Contract Samples

### 20.1 Admin Login
**Request**
```http
POST /api/admin/login
Content-Type: application/json

{"password":"change-me"}
```

**Success**
```http
200 OK
Set-Cookie: admin_session=...

{"ok":true}
```

**Failure**
```http
401 Unauthorized

{"error":"Unauthorized"}
```

### 20.2 Create Event
**Request**
```http
POST /api/events
Content-Type: application/json
Cookie: admin_session=...

{
  "title":"Spring Meetup",
  "slug":"spring-meetup",
  "category":"community",
  "date":"2026-04-10T18:00:00.000Z",
  "status":"DRAFT"
}
```

**Success**
```http
200 OK

{"ok":true,"event":{...}}
```

### 20.3 Update Event Status
**Request**
```http
POST /api/events/{id}/status
Content-Type: application/json
Cookie: admin_session=...

{"status":"PUBLISHED"}
```

**Success**
```http
200 OK

{"ok":true}
```

### 20.4 Duplicate Event
**Request**
```http
POST /api/events/{id}/duplicate
Cookie: admin_session=...
```

**Success**
```http
200 OK

{"ok":true,"event":{...}}
```

### 20.5 Challenge Submission Approval
**Request**
```http
POST /api/challenges/submissions/{id}/approve
Cookie: admin_session=...
```

**Success**
```http
200 OK

{"ok":true}
```

### 20.6 Challenge Submission Denial
**Request**
```http
POST /api/challenges/submissions/{id}/deny
Cookie: admin_session=...
```

**Success**
```http
200 OK

{"ok":true}
```

---

## 21) Open Issues / Deferred Backlog

1. **Multi-admin & RBAC**
   - Current model is single-admin passcode.
   - Deferred: multiple operators with roles/permissions.

2. **Automated test expansion**
   - Baseline build checks exist.
   - Deferred: broader integration/e2e auth and moderation coverage.

3. **Production DB profile**
   - Current baseline uses PostgreSQL.
   - Deferred: first-class Postgres profile and migration playbook.

4. **Advanced moderation UX**
   - Endpoints exist for approve/deny.
   - Deferred: richer queue tooling, audit UI, bulk moderation actions.

5. **Analytics productization**
   - Capture endpoints exist.
   - Deferred: dashboarding, retention policies, and data governance docs.

6. **Operational hardening**
   - Backup scripts exist.
   - Deferred: fully documented restore drills and SLO-backed ops runbook.


---

## 22) Implementation Traceability Matrix

| Feature / Requirement | UI Routes | API Endpoints | Key Implementation Files |
|---|---|---|---|
| Admin login + session issuance | `/admin/login` | `POST /api/admin/login` | `src/app/admin/login/page.tsx`, `src/app/api/admin/login/route.ts`, `src/proxy.ts` |
| Admin logout + redirect to home | `/admin` -> `/` | `POST /api/admin/logout` | `src/components/AdminLogoutButton.tsx`, `src/app/api/admin/logout/route.ts`, `src/app/admin/page.tsx` |
| Admin route protection | `/admin/**` | protected admin/event/challenge endpoints | `src/proxy.ts`, auth helpers in server utils |
| Event creation | `/admin/new` | `POST /api/events` | `src/app/admin/new/page.tsx`, `src/app/api/events/route.ts` |
| Event update/delete | `/admin/[id]/edit` | `PATCH /api/events/[id]`, `DELETE /api/events/[id]` | `src/app/admin/[id]/edit/page.tsx`, `src/app/api/events/[id]/route.ts` |
| Event status workflow | `/admin`, `/admin/[id]/edit` | `POST /api/events/[id]/status` | `src/app/api/events/[id]/status/route.ts`, admin table/actions components |
| Event duplicate/regenerate-code | `/admin` | `POST /api/events/[id]/duplicate`, `POST /api/events/[id]/regenerate-code` | `src/app/api/events/[id]/duplicate/route.ts`, `src/app/api/events/[id]/regenerate-code/route.ts` |
| Admin list UX (pagination/date/default 10) | `/admin` | server-backed listing calls | `src/app/admin/page.tsx`, `src/components/Pagination.tsx`, `src/components/AdminEventsTable.tsx` |
| Bulk event operations | `/admin` | `POST /api/events/bulk`, `POST /api/events/bulk-delete` | `src/app/api/events/bulk/route.ts`, `src/app/api/events/bulk-delete/route.ts` |
| Slug validation | `/admin/new`, `/admin/[id]/edit` | `GET /api/events/slug-check` | `src/app/api/events/slug-check/route.ts`, form validation wiring |
| Public event browsing | `/`, `/events/[slug]`, category pages | read/data fetch flows | `src/app/page.tsx`, event detail route files/components |
| Experience journey | `/experience/[code]`, `/experience/[code]/brief`, `/experience/[code]/challenges`, `/experience/[code]/leaderboard` | challenge/join/analytics endpoints | experience route files + challenge/analytics APIs |
| Challenge CRUD/flow | admin challenge surfaces + experience pages | `POST /api/challenges`, `PATCH /api/challenges/[id]`, `POST /api/challenges/[id]/complete` | `src/app/api/challenges/**/route.ts`, challenge UI components/pages |
| Submission moderation | `/admin/approvals` | `POST /api/challenges/submissions/[id]/approve`, `POST /api/challenges/submissions/[id]/deny` | approvals UI route/components, moderation endpoints |
| Analytics capture | public/experience interactions | `POST /api/analytics/view`, `POST /api/analytics/category`, `POST /api/analytics/search` | `src/app/api/analytics/**/route.ts` |
| Join + subscription capture | public pages | `POST /api/join`, `POST /api/subscribe` | `src/app/api/join/route.ts`, `src/app/api/subscribe/route.ts` |
| Upload handling | admin/content flows | `POST /api/uploads` | `src/app/api/uploads/route.ts` |
| Admin operational controls | admin tools surface | `GET /api/admin/audit`, `POST /api/admin/backup`, `POST /api/admin/reseed`, `POST /api/admin/rotate-password` | `src/app/api/admin/*/route.ts`, admin tools pages/components |

Notes:
- Route/file names above are authoritative to current implementation and should be kept in sync with refactors.
- If feature behavior changes, update this matrix in the same PR.

