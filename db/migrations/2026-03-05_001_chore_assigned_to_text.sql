-- Fix chore_tasks.assigned_to: uuid[] → text[]
-- psycopg3 (psycopg package) sends ARRAY(String) as VARCHAR[], which PostgreSQL
-- rejects when the column type is uuid[]. Changing to text[] aligns the DB column
-- with the SQLModel definition (ARRAY(String) / List[str]).
ALTER TABLE public.chore_tasks
  ALTER COLUMN assigned_to TYPE text[]
  USING assigned_to::text[];
