-- Baseline: public schema tables as currently in Supabase PROD
-- NOTE: this is intended for a fresh DEV database.

-- ensure pgcrypto exists (location/schema doesn't have to match Supabase to work)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- app_state (prod)
CREATE TABLE public.app_state (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT app_state_pkey PRIMARY KEY (key)
);

-- recipes (prod)
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  source_url text,
  notes text,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  time_minutes integer,
  difficulty integer,
  is_active boolean DEFAULT true NOT NULL,
  created_by text DEFAULT 'dennis'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  ingredients text[] DEFAULT '{}'::text[] NOT NULL,
  CONSTRAINT recipes_pkey PRIMARY KEY (id)
);

CREATE INDEX recipes_active_idx ON public.recipes USING btree (is_active);
CREATE INDEX recipes_created_at_idx ON public.recipes USING btree (created_at);

-- weekly_plans (prod)
CREATE TABLE public.weekly_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  week_start_date date NOT NULL,
  days jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT weekly_plans_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_plans_week_start_date_key UNIQUE (week_start_date)
);

-- weekly_plan_drafts (prod)
CREATE TABLE public.weekly_plan_drafts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  week_start_date date NOT NULL,
  base_plan_id uuid,
  proposed_days jsonb NOT NULL,
  requested_swaps integer[] DEFAULT '{}'::integer[] NOT NULL,
  created_by text DEFAULT 'dennis'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT weekly_plan_drafts_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_plan_drafts_base_plan_id_fkey
    FOREIGN KEY (base_plan_id) REFERENCES public.weekly_plans(id) ON DELETE CASCADE
);

CREATE INDEX weekly_plan_drafts_week_idx ON public.weekly_plan_drafts USING btree (week_start_date);
