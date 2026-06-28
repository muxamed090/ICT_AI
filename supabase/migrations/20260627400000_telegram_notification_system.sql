-- =============================================================================
-- Phase 13 — Telegram Notification System
-- Migration: 20260627400000_telegram_notification_system.sql
-- =============================================================================
-- Creates notification_logs and notification_queue tables.
-- Does NOT recreate: notifications, user_settings (telegram fields already exist).
-- =============================================================================

-- ── Notification Logs (Telegram send history) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'telegram',
  chat_id         TEXT,
  message_text    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'sent',   -- 'sent' | 'failed' | 'skipped'
  error_message   TEXT,
  telegram_msg_id BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification_logs"
  ON public.notification_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id
  ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
  ON public.notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status
  ON public.notification_logs(status);

-- ── Notification Queue (retry queue for failed Telegram sends) ────────────────
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL,
  channel        TEXT NOT NULL DEFAULT 'telegram',
  chat_id        TEXT NOT NULL,
  message_text   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'processing' | 'failed'
  retry_count    INTEGER NOT NULL DEFAULT 0,
  max_retries    INTEGER NOT NULL DEFAULT 3,
  next_retry_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification_queue"
  ON public.notification_queue
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id
  ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status
  ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_next_retry
  ON public.notification_queue(next_retry_at)
  WHERE status = 'pending';
