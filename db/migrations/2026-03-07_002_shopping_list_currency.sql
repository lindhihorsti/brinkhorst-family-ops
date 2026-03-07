ALTER TABLE IF EXISTS public.shopping_lists
    ADD COLUMN IF NOT EXISTS estimate_currency TEXT NOT NULL DEFAULT 'chf';
