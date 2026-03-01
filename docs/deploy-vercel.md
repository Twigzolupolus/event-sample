# Vercel Deployment Guide (with PR Preview URLs + Seamless Local Dev)

This guide explains how to deploy this project on Vercel while keeping local development unchanged.

## TL;DR

- **Local dev:** keep SQLite (`prisma/dev.db`) exactly as-is.
- **Cloud deploys (preview + production):** use Postgres.
- **PR previews:** Vercel creates preview URLs automatically for each PR.

---

## 1) Why this split is required

This project currently uses local SQLite for development (`DATABASE_URL="file:./dev.db"`).

That is great locally, but not reliable for serverless cloud runtimes.

So we use:
- Local: SQLite (fast, simple)
- Vercel preview/prod: Postgres (persistent, reliable)

---

## 2) Keep local workflow unchanged

Keep your local `.env` as-is:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
ADMIN_COOKIE_SECRET="change-me-long-random-secret"
```

Continue using:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Canonical local DB remains: `prisma/dev.db`.

---

## 3) Provision cloud Postgres

Choose one:
- Vercel Postgres
- Neon
- Supabase

For fastest Vercel-native setup, use **Vercel Postgres**.

You need a Postgres connection string for `DATABASE_URL`.

---

## 4) Create Vercel project

1. Go to Vercel dashboard.
2. Import GitHub repo: `Twigzolupolus/event-sample`.
3. Framework should detect as Next.js.
4. Build command: `npm run build` (default usually fine).
5. Install command: `npm install` (default usually fine).
6. Set production branch to `main`.

---

## 5) Configure environment variables

In Vercel project settings, add variables for both **Preview** and **Production** environments.

Required vars:

- `DATABASE_URL` (Postgres URL)
- `ADMIN_PASSWORD`
- `ADMIN_COOKIE_SECRET`

Recommended:
- Use different values for Preview vs Production.
- Keep secrets in Vercel env settings only (never commit real secrets).

---

## 6) Migrations for cloud DB

Before first deploy (or as release step), apply migrations to cloud DB:

```bash
DATABASE_URL="<your-postgres-url>" npx prisma migrate deploy
DATABASE_URL="<your-postgres-url>" npm run db:seed
```

Notes:
- Use `migrate deploy` for non-local environments.
- Seed only when needed.

---

## 7) PR preview URL workflow

Once GitHub + Vercel integration is active:

- Every PR gets an automatic preview deployment.
- Each preview gets a unique URL (e.g. `https://<project>-<hash>-<team>.vercel.app`).
- Use preview URL to validate changes before merge.

---

## 8) Preview validation checklist

For each PR preview:

1. Admin login works.
2. Admin list loads.
3. Event create/edit/delete works.
4. Pagination controls work.
5. Default page size remains 10.
6. Event row date is visible.
7. Challenge + moderation flows work.
8. Logout returns to `/`.
9. `/api/admin/login` is not blocked by middleware.

---

## 9) Safe rollout plan

1. Keep local SQLite untouched.
2. Configure Vercel project + env vars.
3. Run Postgres migrations.
4. Open a test PR and verify preview URL.
5. Merge to `main` for production deployment.
6. Run post-deploy smoke checks.

---

## 10) Troubleshooting

### Preview build succeeds but runtime fails
- Check `DATABASE_URL` exists for Preview environment.
- Confirm Postgres instance is reachable.

### Auth failures in preview
- Confirm `ADMIN_PASSWORD` and `ADMIN_COOKIE_SECRET` are set in Preview env.
- Verify middleware still allows `/api/admin/login`.

### Local dev issues after deploy setup
- Ensure local `.env` still uses `DATABASE_URL="file:./dev.db"`.
- Re-run local migrate + seed.

---

## 11) Decision record

- **Hosting:** Vercel
- **Cloud DB:** Postgres (Vercel Postgres / Neon / Supabase)
- **Local DB:** SQLite (`prisma/dev.db`)
- **Preview strategy:** auto-generated Vercel preview URL per PR

