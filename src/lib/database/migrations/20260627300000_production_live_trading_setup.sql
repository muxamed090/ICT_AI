-- =============================================================
-- Phase 12: Production & Live Trading -- Database Migration
-- =============================================================

-- 1. Extend user_settings with production execution parameters
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS decision_mode         TEXT    NOT NULL DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS execution_mode        TEXT    NOT NULL DEFAULT 'confirmation_required',
  ADD COLUMN IF NOT EXISTS trading_environment   TEXT    NOT NULL DEFAULT 'paper_trading',
  ADD COLUMN IF NOT EXISTS max_trades_per_day    INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS enabled_sessions      TEXT[]  NOT NULL DEFAULT ARRAY['london', 'new_york_am', 'new_york_pm'],
  ADD COLUMN IF NOT EXISTS global_paused         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_stop        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_slippage_pips     NUMERIC(4,1) NOT NULL DEFAULT 1.5;

-- 2. Broker Accounts Table -- encrypted broker integrations
CREATE TABLE IF NOT EXISTS broker_accounts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_type           TEXT        NOT NULL, -- 'mt4' | 'mt5' | 'ctrader' | 'binance'
  account_name          TEXT        NOT NULL,
  account_number        TEXT        NOT NULL,
  server_or_environment TEXT        NOT NULL,
  encrypted_credentials TEXT        NOT NULL,
  is_demo               BOOLEAN     NOT NULL DEFAULT true,
  is_active             BOOLEAN     NOT NULL DEFAULT false,
  balance               NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  equity                NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  margin_used           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  free_margin           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  connection_status     TEXT        NOT NULL DEFAULT 'disconnected',
  last_ping_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broker_accounts_user_id ON broker_accounts(user_id);
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own broker accounts" ON broker_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Trade Queue Table -- buffers pending executions and retries
CREATE TABLE IF NOT EXISTS trade_queue (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_account_id  UUID        REFERENCES broker_accounts(id) ON DELETE SET NULL,
  ai_decision_id     UUID        REFERENCES ai_decisions(id) ON DELETE SET NULL,
  pair               TEXT        NOT NULL,
  direction          TEXT        NOT NULL,
  lot_size           NUMERIC(6,2) NOT NULL,
  requested_price    NUMERIC(12,5) NOT NULL,
  stop_loss          NUMERIC(12,5) NOT NULL,
  take_profit        NUMERIC(12,5) NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'queued',
  retry_count        INTEGER     NOT NULL DEFAULT 0,
  max_retries        INTEGER     NOT NULL DEFAULT 3,
  last_error         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trade_queue_user_status ON trade_queue(user_id, status);
ALTER TABLE trade_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trade queue" ON trade_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Broker Orders Table -- executions routed via adapters
CREATE TABLE IF NOT EXISTS broker_orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_account_id   UUID        REFERENCES broker_accounts(id) ON DELETE SET NULL,
  ai_decision_id      UUID        REFERENCES ai_decisions(id) ON DELETE SET NULL,
  broker_ticket       TEXT,
  pair                TEXT        NOT NULL,
  direction           TEXT        NOT NULL,
  lot_size            NUMERIC(6,2) NOT NULL,
  requested_price     NUMERIC(12,5) NOT NULL,
  executed_price      NUMERIC(12,5),
  stop_loss           NUMERIC(12,5) NOT NULL,
  take_profit         NUMERIC(12,5) NOT NULL,
  trading_environment TEXT        NOT NULL DEFAULT 'paper_trading',
  status              TEXT        NOT NULL DEFAULT 'pending',
  rejection_reason    TEXT,
  execution_latency_ms INTEGER,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broker_orders_user_id ON broker_orders(user_id);
ALTER TABLE broker_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own broker orders" ON broker_orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Broker Positions Table -- active live/demo/paper positions
CREATE TABLE IF NOT EXISTS broker_positions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_account_id   UUID        REFERENCES broker_accounts(id) ON DELETE SET NULL,
  broker_ticket       TEXT        NOT NULL,
  pair                TEXT        NOT NULL,
  direction           TEXT        NOT NULL,
  lot_size            NUMERIC(6,2) NOT NULL,
  open_price          NUMERIC(12,5) NOT NULL,
  current_price       NUMERIC(12,5) NOT NULL,
  stop_loss           NUMERIC(12,5) NOT NULL,
  take_profit         NUMERIC(12,5) NOT NULL,
  unrealized_pnl      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  swap                NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  commission          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  trading_environment TEXT        NOT NULL DEFAULT 'paper_trading',
  opened_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broker_positions_user_id ON broker_positions(user_id);
ALTER TABLE broker_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own broker positions" ON broker_positions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Broker Logs Table -- live audit trails
CREATE TABLE IF NOT EXISTS broker_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_account_id   UUID        REFERENCES broker_accounts(id) ON DELETE SET NULL,
  log_level           TEXT        NOT NULL DEFAULT 'info',
  category            TEXT        NOT NULL,
  message             TEXT        NOT NULL,
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broker_logs_user_id ON broker_logs(user_id);
ALTER TABLE broker_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own broker logs" ON broker_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
