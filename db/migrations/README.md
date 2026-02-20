# DB Migrations (Supabase)

If a PR changes DB schema (models/main), it must add a new SQL file under `db/migrations/`.
These SQL files are applied manually in Supabase (SQL Editor).

Naming:
YYYY-MM-DD_<nnn>_<short_desc>.sql
