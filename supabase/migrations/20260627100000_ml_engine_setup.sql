-- =============================================================
-- Phase 10: Machine Learning Engine -- Database Migration
-- =============================================================

-- 1. Extend user_settings with Phase 10 ML configuration fields
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ml_confidence_weight    NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  ADD COLUMN IF NOT EXISTS ml_min_training_samples INTEGER      NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS ml_auto_retrain         BOOLEAN      NOT NULL DEFAULT true;

-- 2. ML Model Registry -- immutable versioned model snapshots
CREATE TABLE IF NOT EXISTS public.ml_model_registry (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version      TEXT        NOT NULL DEFAULT 'ICT-ML-v1',
  ml_mode            TEXT        NOT NULL DEFAULT 'hybrid',
  rule_weights       JSONB       NOT NULL DEFAULT '{}',
  pattern_stats      JSONB       NOT NULL DEFAULT '{}',
  training_samples   INTEGER     NOT NULL DEFAULT 0,
  accuracy_rate      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  avg_confidence     NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  is_active          BOOLEAN     NOT NULL DEFAULT true,
  trained_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ml_model_registry_user_active
  ON public.ml_model_registry(user_id) WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS ml_model_registry_user_id
  ON public.ml_model_registry(user_id);

CREATE INDEX IF NOT EXISTS ml_model_registry_model_version
  ON public.ml_model_registry(user_id, model_version);

ALTER TABLE public.ml_model_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ML model registry"
  ON public.ml_model_registry FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. ML Predictions -- each inference stored, outcome linked back
CREATE TABLE IF NOT EXISTS public.ml_predictions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_decision_id     UUID        REFERENCES public.ai_decisions(id) ON DELETE SET NULL,
  model_version      TEXT        NOT NULL DEFAULT 'ICT-ML-v1',
  pair               TEXT        NOT NULL,
  timeframe          TEXT        NOT NULL,
  session            TEXT        NOT NULL,
  ml_score           NUMERIC(5,2) NOT NULL,
  ml_confidence      NUMERIC(5,2) NOT NULL,
  ml_bias            TEXT        NOT NULL DEFAULT 'neutral',
  ml_recommendation  TEXT        NOT NULL DEFAULT 'WAIT',
  feature_vector     JSONB       NOT NULL DEFAULT '{}',
  actual_outcome     TEXT,
  is_correct         BOOLEAN,
  outcome_linked_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ml_predictions_user_id ON public.ml_predictions(user_id);
CREATE INDEX IF NOT EXISTS ml_predictions_pair ON public.ml_predictions(pair);
CREATE INDEX IF NOT EXISTS ml_predictions_model_version ON public.ml_predictions(model_version);
CREATE INDEX IF NOT EXISTS ml_predictions_ai_decision_id ON public.ml_predictions(ai_decision_id);
CREATE INDEX IF NOT EXISTS ml_predictions_is_correct ON public.ml_predictions(user_id, is_correct);

ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ML predictions"
  ON public.ml_predictions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
