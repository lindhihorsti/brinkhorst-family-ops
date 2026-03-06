-- Split: Ausgaben-Tracking
CREATE TABLE IF NOT EXISTS expenses (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT          NOT NULL,
    amount      NUMERIC(10,2) NOT NULL,
    paid_by     TEXT          NOT NULL,
    split_among TEXT[]        NOT NULL DEFAULT '{}',
    category    TEXT          NOT NULL DEFAULT 'Sonstiges',
    date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    notes       TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses (paid_by);
