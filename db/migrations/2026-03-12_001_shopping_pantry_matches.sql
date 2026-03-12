ALTER TABLE IF EXISTS public.shopping_list_items
  ADD COLUMN IF NOT EXISTS pantry_name text;

ALTER TABLE IF EXISTS public.shopping_list_items
  ADD COLUMN IF NOT EXISTS pantry_uncertain boolean NOT NULL DEFAULT false;
