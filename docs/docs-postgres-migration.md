# Postgres Migration Guide (when traffic grows)

Current local development DB uses SQLite for speed.

## When to move
- sustained traffic
- concurrent admin writes
- backup/replication requirements

## Steps
1. Provision Postgres (Neon/Supabase/RDS)
2. Update `prisma/schema.prisma` datasource provider from `sqlite` to `postgresql`
3. Set `DATABASE_URL` to your Postgres connection string
4. Run:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
5. Seed/migrate data from SQLite export (custom script)
6. Verify app with `npm run build` and smoke tests

## Notes
- keep indexes on `status`, `date`, `category`, `scheduledPublishAt`
- enable automated backups on the Postgres provider
