CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    notes TEXT NULL,
    view_mode TEXT NOT NULL DEFAULT 'checklist',
    import_mode TEXT NOT NULL DEFAULT 'ai_consolidated',
    estimate_currency TEXT NOT NULL DEFAULT 'chf',
    includes_weekly_items BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_total_text TEXT NULL,
    estimated_total_amount NUMERIC(10, 2) NULL,
    estimated_total_note TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    item_order INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    recipe_title TEXT NULL,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id
    ON public.shopping_list_items(list_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id_order
    ON public.shopping_list_items(list_id, source, item_order, created_at);
