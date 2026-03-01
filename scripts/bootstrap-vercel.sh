#!/usr/bin/env bash
set -euo pipefail

# bootstrap-vercel.sh
# Near-automatic Vercel + Postgres setup for this repo.
#
# Requirements:
# - vercel CLI installed and authenticated (`vercel login` once)
# - gh CLI authenticated (optional, for test PR creation)
# - Node/npm available
#
# Environment variables:
#   REQUIRED
#     DATABASE_URL_PREVIEW
#     DATABASE_URL_PRODUCTION
#     ADMIN_PASSWORD_PREVIEW
#     ADMIN_PASSWORD_PRODUCTION
#     ADMIN_COOKIE_SECRET_PREVIEW
#     ADMIN_COOKIE_SECRET_PRODUCTION
#
#   OPTIONAL
#     VERCEL_PROJECT_NAME   (defaults to current directory name)
#     RUN_MIGRATIONS=true   (default true)
#     RUN_SEED=true         (default false)
#     CREATE_TEST_PR=true   (default false)
#
# Usage:
#   chmod +x scripts/bootstrap-vercel.sh
#   DATABASE_URL_PREVIEW=... DATABASE_URL_PRODUCTION=... \
#   ADMIN_PASSWORD_PREVIEW=... ADMIN_PASSWORD_PRODUCTION=... \
#   ADMIN_COOKIE_SECRET_PREVIEW=... ADMIN_COOKIE_SECRET_PRODUCTION=... \
#   ./scripts/bootstrap-vercel.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_vars=(
  DATABASE_URL_PREVIEW
  DATABASE_URL_PRODUCTION
  ADMIN_PASSWORD_PREVIEW
  ADMIN_PASSWORD_PRODUCTION
  ADMIN_COOKIE_SECRET_PREVIEW
  ADMIN_COOKIE_SECRET_PRODUCTION
)

for v in "${required_vars[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ Missing required env var: $v"
    exit 1
  fi
done

PROJECT_NAME="${VERCEL_PROJECT_NAME:-$(basename "$ROOT_DIR")}" 
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RUN_SEED="${RUN_SEED:-false}"
CREATE_TEST_PR="${CREATE_TEST_PR:-false}"

echo "▶ Linking/initializing Vercel project: $PROJECT_NAME"
# --yes avoids interactive prompts where possible
vercel link --yes --project "$PROJECT_NAME" || vercel --yes

echo "▶ Pulling Vercel environment metadata"
vercel pull --yes --environment=preview || true
vercel pull --yes --environment=production || true

set_vercel_env () {
  local key="$1"
  local val="$2"
  local env="$3" # preview or production

  # Remove old value if exists, then add deterministic value.
  vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
  printf "%s" "$val" | vercel env add "$key" "$env"
}

echo "▶ Setting Preview env vars"
set_vercel_env "DATABASE_URL" "$DATABASE_URL_PREVIEW" "preview"
set_vercel_env "ADMIN_PASSWORD" "$ADMIN_PASSWORD_PREVIEW" "preview"
set_vercel_env "ADMIN_COOKIE_SECRET" "$ADMIN_COOKIE_SECRET_PREVIEW" "preview"

echo "▶ Setting Production env vars"
set_vercel_env "DATABASE_URL" "$DATABASE_URL_PRODUCTION" "production"
set_vercel_env "ADMIN_PASSWORD" "$ADMIN_PASSWORD_PRODUCTION" "production"
set_vercel_env "ADMIN_COOKIE_SECRET" "$ADMIN_COOKIE_SECRET_PRODUCTION" "production"

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  echo "▶ Running Prisma migrations against Production DB"
  DATABASE_URL="$DATABASE_URL_PRODUCTION" npx prisma migrate deploy
fi

if [[ "$RUN_SEED" == "true" ]]; then
  echo "▶ Running seed against Production DB"
  DATABASE_URL="$DATABASE_URL_PRODUCTION" npm run db:seed
fi

if [[ "$CREATE_TEST_PR" == "true" ]]; then
  echo "▶ Creating lightweight test PR for preview verification"
  BRANCH="chore/vercel-preview-smoke-$(date +%s)"
  git checkout -b "$BRANCH"
  echo "Vercel preview smoke marker: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .vercel-preview-smoke
  git add .vercel-preview-smoke
  git commit -m "chore: trigger vercel preview smoke deployment"
  git push -u origin "$BRANCH"
  gh pr create --title "chore: vercel preview smoke deployment" --body "Triggers Vercel preview to validate deployment path." --base main --head "$BRANCH"
fi

echo "✅ Vercel bootstrap completed"

echo "Next:"
echo "1) Open a PR and confirm preview URL appears."
echo "2) Validate login, /admin, CRUD, pagination, logout on preview."
