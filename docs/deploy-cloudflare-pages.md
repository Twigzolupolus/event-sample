# Cloudflare Pages Deployment Guide (with Seamless Local Development)

This guide gives you PR preview URLs on Cloudflare while preserving your current local workflow.

## Goal

- Use Postgres via environment-specific `DATABASE_URL` values.
- Add cloud previews for PRs and production deploys on Cloudflare Pages.
- Note: current app architecture is Node-runtime oriented; Cloudflare Pages may require Edge refactor.

---

## Recommended Approach

Use **Cloudflare Pages + external Postgres (Neon)** for previews/prod.

Why:
- Your app uses Prisma with PostgreSQL in local and hosted environments.
- Cloudflare runtime does not reliably support local file DB persistence.
- Prisma + Postgres is the lowest-friction cloud path.

---

## 1) Local Workflow

Use local/dev Postgres in `.env`:
- `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"`

Continue using:
- `npm run db:migrate`
- `npm run db:seed`
- `npm run dev`

---

## 2) Create a Neon Project (Cloud Database)

1. Go to Neon dashboard and create a new project.
2. Copy the Postgres connection string (pooled and direct URLs if provided).
3. Store it securely.

You will use this as `DATABASE_URL` in Cloudflare Pages.

---

## 3) Create Cloudflare Pages Project

1. Cloudflare Dashboard → Pages → Create project.
2. Connect GitHub repo: `Twigzolupolus/event-sample`.
3. Set build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Output directory: Next.js default (as required by Cloudflare Pages Next support)
4. Production branch: `main`.

---

## 4) Enable PR Preview Deployments

Cloudflare Pages preview deployments are automatic for non-main branches/PRs.

Expected behavior:
- Every PR gets a unique preview URL, e.g.
  - `https://<hash>.<project>.pages.dev`

Use these URLs for review before merge.

---

## 5) Configure Environment Variables in Cloudflare

In **Pages → Settings → Environment variables**, set:

### Preview environment
- `DATABASE_URL` = Neon preview/staging DB URL
- `ADMIN_PASSWORD` = preview admin password
- `ADMIN_COOKIE_SECRET` = long random secret

### Production environment
- `DATABASE_URL` = Neon production DB URL
- `ADMIN_PASSWORD` = production admin password
- `ADMIN_COOKIE_SECRET` = different long random secret

Notes:
- Never commit real secrets.
- Keep `.env.example` placeholder-only.

---

## 6) Database Migration Strategy (Cloud)

Use Prisma migrations against Postgres before/with deploy.

### Option A (simple manual release flow)
Run before first production deploy:

```bash
DATABASE_URL="<neon-url>" npx prisma migrate deploy
DATABASE_URL="<neon-url>" npm run db:seed
```

### Option B (CI-controlled)
- Add a migration step in deployment pipeline for production branch.
- Seed only when required.

---

## 7) Preserve Local Seamless Dev with Env Files

Use separate env files:

- `.env` (local default): PostgreSQL URL
- `.env.preview` (optional): preview-like values
- `.env.production` (optional): production-like values

Example local `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
ADMIN_PASSWORD="change-me"
ADMIN_COOKIE_SECRET="change-me-long-random-secret"
```

This keeps local work unchanged while cloud uses Pages-managed env vars.

---

## 8) PR Review Checklist (Using Preview URL)

On each PR preview URL, verify:

1. Admin login works.
2. Admin list loads.
3. Create/edit/delete event works.
4. Pagination works (First/Prev/numbered/Next/Last).
5. Default page size is 10.
6. Event row shows date.
7. Challenge submit + moderation endpoints/flows behave.
8. Logout returns to `/`.
9. No middleware regression blocking `/api/admin/login`.

---

## 9) First-Time Cutover Plan (Safe)

1. Keep current local Postgres setup intact.
2. Configure Cloudflare + Neon env vars.
3. Run cloud migrations.
4. Deploy one test branch, validate preview URL.
5. Merge to `main` for production deploy.
6. Perform post-deploy smoke test.

---

## 10) Troubleshooting

### Preview deploy builds but app fails at runtime
- Check `DATABASE_URL` exists in Preview environment.
- Verify Postgres DB accepts connections.

### Login fails in preview
- Confirm `ADMIN_PASSWORD` and `ADMIN_COOKIE_SECRET` are set in Preview env.
- Confirm middleware still allowlists `/api/admin/login`.

### Local dev broke after cloud setup
- Ensure local `.env` still uses `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"`.
- Re-run local migrate + seed.

---

## 11) Decision Record

- **Local:** PostgreSQL (dev instance)
- **Cloud previews/prod:** PostgreSQL (Neon/Supabase/Vercel Postgres)
- **Hosting:** Cloudflare Pages with automatic PR preview URLs.

