-- Add onboarding-related fields to workspaces
ALTER TABLE IF EXISTS workspaces
ADD COLUMN IF NOT EXISTS competitors_to_monitor text [],
  ADD COLUMN IF NOT EXISTS platforms text [],
  ADD COLUMN IF NOT EXISTS default_offer text,
  ADD COLUMN IF NOT EXISTS preferred_tone text,
  ADD COLUMN IF NOT EXISTS run_frequency text;
-- Track per-user onboarding progress across all 9 steps.
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1 CHECK (
    current_step >= 1
    AND current_step <= 9
  ),
  completed_steps integer [] NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id)
);
CREATE INDEX IF NOT EXISTS onboarding_progress_user_id_idx ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS onboarding_progress_workspace_id_idx ON onboarding_progress(workspace_id);
CREATE INDEX IF NOT EXISTS onboarding_progress_current_step_idx ON onboarding_progress(current_step);
-- Persist Stripe checkout attempts/sessions for reconciliation.
CREATE TABLE IF NOT EXISTS stripe_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE
  SET NULL,
    session_id text,
    status text,
    amount integer,
    currency text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stripe_checkouts_workspace_id_idx ON stripe_checkouts(workspace_id);
CREATE INDEX IF NOT EXISTS stripe_checkouts_user_id_idx ON stripe_checkouts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS stripe_checkouts_session_id_uniq ON stripe_checkouts(session_id)
WHERE session_id IS NOT NULL;
-- Product catalog for scalable subscription plans.
CREATE TABLE IF NOT EXISTS subscription_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  currency text NOT NULL CHECK (char_length(currency) = 3),
  unit_amount_cents integer NOT NULL CHECK (unit_amount_cents > 0),
  recurring_interval text NOT NULL CHECK (
    recurring_interval IN ('day', 'week', 'month', 'year')
  ),
  is_active boolean NOT NULL DEFAULT true,
  stripe_product_id text UNIQUE,
  stripe_price_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_products_active_idx ON subscription_products(is_active);
ALTER TABLE IF EXISTS workspaces
ADD COLUMN IF NOT EXISTS subscription_product_id uuid REFERENCES subscription_products(id) ON DELETE
SET NULL;
-- Idempotent seed for initial NECTY Pro product.
INSERT INTO subscription_products (
    code,
    name,
    description,
    currency,
    unit_amount_cents,
    recurring_interval,
    is_active
  )
VALUES (
    'NECTY_PRO_MONTHLY',
    'NECTY Pro',
    'NECTY Pro monthly subscription',
    'usd',
    19999,
    'month',
    true
  ) ON CONFLICT (code) DO
UPDATE
SET name = EXCLUDED.name,
  description = EXCLUDED.description,
  currency = EXCLUDED.currency,
  unit_amount_cents = EXCLUDED.unit_amount_cents,
  recurring_interval = EXCLUDED.recurring_interval,
  is_active = EXCLUDED.is_active;