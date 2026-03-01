## Event Board (Public + Single Admin)

Simple event registry web app.

### Features
- Public event list (`/`)
- Public event details (`/events/[slug]`)
- Admin login (`/admin/login`)
- Admin CRUD (`/admin`)
- Draft vs Published
- Seeded sample events

### Project stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Database:** SQLite (Prisma ORM)
- **ORM & Migrations:** Prisma (`@prisma/client` + `prisma` CLI)
- **Validation:** Zod
- **Styling:** Tailwind CSS 4
- **Linting:** ESLint (Next config)
- **Runtime/Tooling:** Node.js, tsx (for seed/dev scripts)

### Setup (first run)
```bash
npm install --include=dev
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

### Required `.env` values
```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
ADMIN_COOKIE_SECRET="change-me-long-random-secret"
```

> With schema at `prisma/schema.prisma`, `DATABASE_URL="file:./dev.db"` resolves to `prisma/dev.db`.


### Database file location
- Canonical SQLite file: `prisma/dev.db`
- Do **not** use `dev.db` at repo root or `prisma/prisma/dev.db`
- Keep `DATABASE_URL="file:./dev.db"` (it resolves to `prisma/dev.db` because schema is under `prisma/`)

### Daily commands (important)

Run app:
```bash
npm run dev
```

Build check:
```bash
npm run build
```

Apply migrations (dev):
```bash
npm run db:migrate
```

Seed database:
```bash
npm run db:seed
```

Reset DB + re-seed (clean local reset):
```bash
npx prisma migrate reset --force --skip-seed
npm run db:seed
```

Reset admin credential row:
```bash
npm run admin:reset
```

### Admin access
- URL: `http://localhost:3000/admin/login`
- Password: from `ADMIN_PASSWORD` in `.env`

Quick API login test:
```bash
curl -i -X POST http://127.0.0.1:3000/api/admin/login \
  -H "Content-Type: application/json" \
  --data-raw '{"password":"change-me"}'
```

Expected success response:
- HTTP `200`
- Body contains: `{"ok":true}`

### Troubleshooting
If login keeps failing:
1. Ensure you are in project directory: `~/.openclaw/workspace-developer/event-board`
2. Ensure `.env` has correct values
3. Ensure only one dev server is running:
   ```bash
   pkill -f "next dev" || true
   npm run dev
   ```
4. Run clean reset:
   ```bash
   npx prisma migrate reset --force --skip-seed
   npm run db:seed
   npm run admin:reset
   ```

### Notes
- No RSVP
- No user accounts
- URL-only image field

### Security & ops
See `docs/docs-security-ops.md` for rate limiting, CSRF, passcode rotation, and backup automation.
