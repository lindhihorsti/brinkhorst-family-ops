CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NULL,
    category TEXT NOT NULL DEFAULT 'sonstiges',
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'chf',
    interval TEXT NOT NULL DEFAULT 'monthly',
    next_due_date DATE NOT NULL,
    payment_method TEXT NULL,
    responsible_party TEXT NOT NULL DEFAULT 'gemeinsam',
    account_label TEXT NULL,
    contract_start_date DATE NULL,
    contract_end_date DATE NULL,
    cancellation_notice_days INTEGER NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_active_due
    ON public.fixed_expenses (is_active, next_due_date);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category
    ON public.fixed_expenses (category, is_active);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_responsible
    ON public.fixed_expenses (responsible_party, is_active);

CREATE TABLE IF NOT EXISTS public.finance_monthly_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_start DATE NOT NULL,
    person TEXT NOT NULL,
    net_income_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_monthly_incomes_month_person_key UNIQUE (month_start, person)
);

CREATE INDEX IF NOT EXISTS idx_finance_monthly_incomes_month
    ON public.finance_monthly_incomes (month_start);
