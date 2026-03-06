ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS paid_by_member_id UUID,
    ADD COLUMN IF NOT EXISTS split_among_member_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_member_id
    ON public.expenses (paid_by_member_id);
