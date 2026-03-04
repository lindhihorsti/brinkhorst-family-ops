-- Premium features migration
-- New tables: family_members, meal_history, chore_tasks, chore_assignments, pinboard_notes, birthdays
-- Enhanced: recipes (servings, rating, cooked_count, photo_url, nutrition_info, collection_name)
--           weekly_plans (assigned_cooks, guest_count)

-- ─── family_members ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id         uuid DEFAULT gen_random_uuid() NOT NULL,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#888888',
  initials   text NOT NULL DEFAULT '?',
  telegram_id text,
  dietary_restrictions text[] DEFAULT '{}'::text[] NOT NULL,
  is_active  boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT family_members_pkey PRIMARY KEY (id)
);

-- ─── meal_history ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_history (
  id         uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id  uuid NOT NULL,
  cooked_on  date NOT NULL,
  rating     numeric(2,1),            -- 1.0 – 5.0
  cooked_by  uuid,                    -- FK family_members.id (nullable)
  notes      text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT meal_history_pkey PRIMARY KEY (id),
  CONSTRAINT meal_history_recipe_fkey FOREIGN KEY (recipe_id)
    REFERENCES public.recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS meal_history_recipe_idx ON public.meal_history(recipe_id);
CREATE INDEX IF NOT EXISTS meal_history_date_idx   ON public.meal_history(cooked_on);

-- ─── chore_tasks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chore_tasks (
  id            uuid DEFAULT gen_random_uuid() NOT NULL,
  title         text NOT NULL,
  description   text,
  recurrence    text NOT NULL DEFAULT 'weekly',  -- daily / weekly / biweekly / monthly
  assigned_to   uuid[],                           -- family_member ids in rotation order
  current_idx   integer DEFAULT 0 NOT NULL,
  points        integer DEFAULT 1 NOT NULL,
  is_active     boolean DEFAULT true NOT NULL,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT chore_tasks_pkey PRIMARY KEY (id)
);

-- ─── chore_completions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chore_completions (
  id            uuid DEFAULT gen_random_uuid() NOT NULL,
  chore_id      uuid NOT NULL,
  completed_by  uuid NOT NULL,              -- family_member id
  completed_on  date NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT chore_completions_pkey PRIMARY KEY (id),
  CONSTRAINT chore_completions_chore_fkey FOREIGN KEY (chore_id)
    REFERENCES public.chore_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS chore_completions_chore_idx ON public.chore_completions(chore_id);
CREATE INDEX IF NOT EXISTS chore_completions_date_idx  ON public.chore_completions(completed_on);

-- ─── pinboard_notes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pinboard_notes (
  id          uuid DEFAULT gen_random_uuid() NOT NULL,
  content     text NOT NULL,
  author_id   uuid,                       -- family_member id (nullable)
  author_name text,                       -- fallback if no member
  tag         text DEFAULT 'allgemein',   -- allgemein / schule / einkauf / wichtig / event
  expires_on  date,
  photo_url   text,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT pinboard_notes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS pinboard_notes_created_idx ON public.pinboard_notes(created_at DESC);

-- ─── birthdays ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.birthdays (
  id            uuid DEFAULT gen_random_uuid() NOT NULL,
  name          text NOT NULL,
  birth_date    date NOT NULL,
  relation      text DEFAULT 'Familie',    -- Familie / Freunde / Arbeit etc.
  member_id     uuid,                       -- if linked to a family_member
  gift_ideas    text[] DEFAULT '{}'::text[],
  notes         text,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT birthdays_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS birthdays_date_idx ON public.birthdays(
  EXTRACT(MONTH FROM birth_date),
  EXTRACT(DAY   FROM birth_date)
);

-- ─── recipes: new columns ─────────────────────────────────────────────────────
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS servings        integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS rating          numeric(2,1),
  ADD COLUMN IF NOT EXISTS cooked_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_url       text,
  ADD COLUMN IF NOT EXISTS nutrition_info  jsonb,
  ADD COLUMN IF NOT EXISTS collection_name text;

-- ─── weekly_plans: new columns ────────────────────────────────────────────────
ALTER TABLE public.weekly_plans
  ADD COLUMN IF NOT EXISTS assigned_cooks jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS guest_count    integer DEFAULT 0;
