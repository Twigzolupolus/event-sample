## Event Board (Public + Single Admin)

Simple event registry web app.

### Features
- Public event list (`/`)
- Public event details (`/events/[slug]`)
- Admin login (`/admin/login`)
- Admin CRUD (`/admin`)
- Draft vs Published
- Seeded sample events

### Setup
```bash
npm install --include=dev
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

### Admin access
- URL: `http://localhost:3000/admin/login`
- Password: from `ADMIN_PASSWORD` in `.env`

### Notes
- No RSVP
- No user accounts
- URL-only image field

### Security & ops
See `docs-security-ops.md` for rate limiting, CSRF, passcode rotation, and backup automation.
