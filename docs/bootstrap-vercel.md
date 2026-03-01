# Vercel Bootstrap Automation

This document explains how to use `scripts/bootstrap-vercel.sh` to near-automate Vercel setup for new projects.

## What it automates

- Links/initializes a Vercel project
- Sets env vars for Preview + Production
- Optionally runs Prisma migrations
- Optionally runs DB seed
- Optionally opens a test PR to trigger preview deploy

## Prerequisites (one-time)

1. Install and auth Vercel CLI
   - `npm i -g vercel`
   - `vercel login`
2. Install and auth GitHub CLI (optional test PR path)
   - `gh auth login`
3. Ensure Node/npm are installed

## Required env vars

- `DATABASE_URL_PREVIEW`
- `DATABASE_URL_PRODUCTION`
- `ADMIN_PASSWORD_PREVIEW`
- `ADMIN_PASSWORD_PRODUCTION`
- `ADMIN_COOKIE_SECRET_PREVIEW`
- `ADMIN_COOKIE_SECRET_PRODUCTION`

## Optional env vars

- `VERCEL_PROJECT_NAME` (default: repo dir name)
- `RUN_MIGRATIONS=true|false` (default `true`)
- `RUN_SEED=true|false` (default `false`)
- `CREATE_TEST_PR=true|false` (default `false`)

## Usage

```bash
chmod +x scripts/bootstrap-vercel.sh

DATABASE_URL_PREVIEW="<preview-db-url>" \
DATABASE_URL_PRODUCTION="<prod-db-url>" \
ADMIN_PASSWORD_PREVIEW="<preview-pass>" \
ADMIN_PASSWORD_PRODUCTION="<prod-pass>" \
ADMIN_COOKIE_SECRET_PREVIEW="<preview-cookie-secret>" \
ADMIN_COOKIE_SECRET_PRODUCTION="<prod-cookie-secret>" \
./scripts/bootstrap-vercel.sh
```

### With seed + smoke PR

```bash
RUN_SEED=true CREATE_TEST_PR=true ./scripts/bootstrap-vercel.sh
```

## Recommended workflow for new projects

1. Clone repo
2. Run `bootstrap-vercel.sh` with project secrets
3. Open small PR and verify preview URL is generated
4. Validate critical app flows in preview
5. Merge to `main` for production deploy

## Security notes

- Never commit real secrets to git
- Keep production secrets distinct from preview secrets
- Rotate `ADMIN_COOKIE_SECRET` periodically

