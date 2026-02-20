# DB Changes Quick Guide (Supabase)

## When do I need a migration?
Whenever you change schema-relevant code:
- `backend/app/models.py`
- `backend/app/main.py` (schema init / table changes)

CI will enforce this.

## Create a migration file
Example:
`db/migrations/2026-02-20_001_add_new_column.sql`

Template:
```sql
-- Example: add a column
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS source_url text;

-- Example: add an index
CREATE INDEX IF NOT EXISTS idx_recipes_source_url ON public.recipes (source_url);
