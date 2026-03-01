# Security & Ops Notes

## Rate limiting
- Applied at proxy layer for admin APIs.
- Login: 10 requests/minute per IP.
- Other admin API endpoints: 120 requests/minute per IP.

## CSRF protection
- State-changing admin API requests require same-origin `Origin` header.
- Cross-origin POST/PATCH/PUT/DELETE to admin APIs are rejected with 403.

## Admin passcode rotation
- New endpoint: `POST /api/admin/rotate-password`
- Requires admin session.
- Validates current password, enforces new password min length of 8.

## Daily backups
- Script: `npm run backup:db`
- Copies `prisma/dev.db` to `backups/dev-<timestamp>.db`

### Example cron (daily at 2:15 AM UTC)
```cron
15 2 * * * cd /path/to/event-board && /usr/bin/npm run backup:db >> backup.log 2>&1
```
