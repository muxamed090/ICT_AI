-- =============================================================
-- Phase 11: Backtesting Engine -- Database Migration
-- =============================================================

-- 1. Backtest Runs Table -- immutable versioned performance snapshots
CREATE TABLE IF NOT EXISTS backtest_runs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT        NOT NULL DEFAULT 'Backtest Run',
  description             TEXT,
  ml_mode                 TEXT        NOT NULL DEFAULT 'rules_only',
  model_version           TEXT        NOT NULL DEFAULT 'ICT-AI-v1',
  rules_engine_version    TEXT        NOT NULL DEFAULT 'ICT-Rules-v1.0',
  decision_engine_version TEXT        NOT NULL DEFAULT 'ICT-Decision-v1.0',
  ml_engine_version       TEXT        NOT NULL DEFAULT 'ICT-ML-v1.0',
  date_from               DATE        NOT NULL,
  date_to                 DATE        NOT NULL,
  pair_filter             TEXT[],
  session_filter          TEXT[],
  total_trades            INTEGER     NOT NULL DEFAULT 0,
  winning_trades          INTEGER     NOT NULL DEFAULT 0,
  losing_trades           INTEGER     NOT NULL DEFAULT 0,
  breakeven_trades        INTEGER     NOT NULL DEFAULT 0,
  win_rate                NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  loss_rate               NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  profit_factor           NUMERIC(7,4) NOT NULL DEFAULT 0.00,
  expectancy              NUMERIC(7,4) NOT NULL DEFAULT 0.00,
  avg_rr                  NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  net_pnl                 NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  gross_profit            NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  gross_loss              NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  max_drawdown            NUMERIC(7,4) NOT NULL DEFAULT 0.00,
  max_drawdown_pct        NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  sharpe_ratio            NUMERIC(7,4),
  report                  JSONB        NOT NULL DEFAULT '{}',
  status                  TEXT        NOT NULL DEFAULT 'completed',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS backtest_runs_user_id ON backtest_runs(user_id);
CREATE INDEX IF NOT EXISTS backtest_runs_created_at ON backtest_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS backtest_runs_ml_mode ON backtest_runs(user_id, ml_mode);

ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own backtest runs"
  ON backtest_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Backtest Trades Table -- detailed per-trade replay history
CREATE TABLE IF NOT EXISTS backtest_trades (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  backtest_run_id    UUID        NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_id         UUID        REFERENCES trade_journal(id) ON DELETE SET NULL,
  pair               TEXT        NOT NULL,
  direction          TEXT        NOT NULL,
  session            TEXT        NOT NULL,
  killzone           TEXT        NOT NULL,
  setup_type         TEXT        NOT NULL,
  timeframe          TEXT        NOT NULL,
  entry_price        NUMERIC(12,5) NOT NULL,
  stop_loss          NUMERIC(12,5) NOT NULL,
  take_profit        NUMERIC(12,5) NOT NULL,
  risk_reward        NUMERIC(5,2) NOT NULL,
  result             TEXT        NOT NULL,
  pnl                NUMERIC(12,2) NOT NULL,
  ict_score          NUMERIC(5,2),
  ml_score           NUMERIC(5,2),
  final_score        NUMERIC(5,2),
  ai_decision        TEXT,
  ai_confidence      NUMERIC(5,2),
  running_equity     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  running_drawdown   NUMERIC(7,4)  NOT NULL DEFAULT 0.00,
  trade_index        INTEGER       NOT NULL DEFAULT 0,
  traded_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS backtest_trades_run_id ON backtest_trades(backtest_run_id);
CREATE INDEX IF NOT EXISTS backtest_trades_user_id ON backtest_trades(user_id);

ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own backtest trades"
  ON backtest_trades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
