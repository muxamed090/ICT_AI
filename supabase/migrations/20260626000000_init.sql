-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==================================================
-- 1. PostgreSQL ENUM Types
-- ==================================================
create type public.order_direction as enum ('buy', 'sell');
create type public.trading_session as enum ('asian', 'london', 'new_york_am', 'new_york_pm', 'london_close');
create type public.ict_killzone as enum ('asia', 'london', 'new_york', 'none');
create type public.market_bias as enum ('bullish', 'bearish', 'neutral');
create type public.fvg_type as enum ('bisi', 'sibi', 'none');
create type public.trade_result as enum ('win', 'loss', 'breakeven', 'pending');
create type public.signal_status as enum ('pending', 'active', 'expired', 'cancelled', 'completed');
create type public.ml_mode_enum as enum ('rules_only', 'hybrid', 'ml_priority');

-- ==================================================
-- 2. Database Tables Setup
-- ==================================================

-- A. Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  language text default 'en',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- B. User Settings table
create table public.user_settings (
  id uuid references auth.users on delete cascade primary key,
  theme text default 'dark',
  timezone text default 'UTC',
  language text default 'en',
  notification_enabled boolean default true,
  telegram_enabled boolean default false,
  telegram_chat_id text,
  risk_percent numeric(5,2) default 1.00,
  ai_learning_enabled boolean default true,
  ml_mode public.ml_mode_enum default 'rules_only',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- C. Watchlist table
create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  favorite boolean default false,
  enabled boolean default true,
  priority integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, pair)
);

-- D. AI Predictions History table (For ML tracking)
create table public.ai_predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  timeframe text not null,
  prediction_type text not null,
  predicted_value text not null,
  confidence numeric(5,2) not null,
  actual_outcome text,
  is_correct boolean,
  model_version text not null,
  features_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- E. Trade Journal table
create table public.trade_journal (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  direction public.order_direction not null,
  timeframe text not null,
  session public.trading_session not null,
  killzone public.ict_killzone not null,
  setup_type text not null,
  entry numeric(12,5) not null,
  stop_loss numeric(12,5) not null,
  take_profit numeric(12,5) not null,
  risk_reward numeric(5,2) not null,
  result public.trade_result not null default 'pending',
  pnl numeric(12,2) default 0.00,
  notes text,
  screenshot_url text,
  ai_confidence numeric(5,2),
  prediction_id uuid references public.ai_predictions on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- F. AI Analysis table
create table public.ai_analysis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  timeframe text not null,
  market_bias public.market_bias not null default 'neutral',
  confluence_score numeric(5,2) not null,
  bos boolean default false,
  choch boolean default false,
  order_block_mitigated boolean default false,
  order_block_price numeric(12,5),
  fvg_type public.fvg_type not null default 'none',
  fvg_price numeric(12,5),
  liquidity_sweep_high boolean default false,
  liquidity_sweep_low boolean default false,
  ote_zone_detected boolean default false,
  killzone public.ict_killzone not null,
  session public.trading_session not null,
  confidence numeric(5,2) not null,
  explanation text not null,
  model_version text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- G. Signals table
create table public.signals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  direction public.order_direction not null,
  score numeric(5,2) not null,
  confidence numeric(5,2) not null,
  entry numeric(12,5) not null,
  stop_loss numeric(12,5) not null,
  tp1 numeric(12,5) not null,
  tp2 numeric(12,5) not null,
  status public.signal_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- H. Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- I. Economic Events calendar table (Read-only for normal users)
create table public.economic_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  currency text not null,
  impact text not null check (impact in ('low', 'medium', 'high')),
  event_time timestamp with time zone not null,
  forecast text,
  previous text,
  actual text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- J. AI Learning Stats table (aggregate details)
create table public.ai_learning_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  model_version text not null,
  pattern_type text not null,
  total_predictions integer default 0,
  correct_predictions integer default 0,
  accuracy_rate numeric(5,2) default 0.00,
  avg_confidence numeric(5,2) default 0.00,
  learning_iterations integer default 0,
  last_trained_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==================================================
-- 3. Row Level Security (RLS) Configuration
-- ==================================================
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.watchlist enable row level security;
alter table public.ai_predictions enable row level security;
alter table public.trade_journal enable row level security;
alter table public.ai_analysis enable row level security;
alter table public.signals enable row level security;
alter table public.notifications enable row level security;
alter table public.economic_events enable row level security;
alter table public.ai_learning_stats enable row level security;

-- Profiles Policies
create policy "Allow select profiles" on public.profiles for select using (auth.uid() = id);
create policy "Allow insert profiles" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow update profiles" on public.profiles for update using (auth.uid() = id);
create policy "Allow delete profiles" on public.profiles for delete using (auth.uid() = id);

-- User Settings Policies
create policy "Allow select settings" on public.user_settings for select using (auth.uid() = id);
create policy "Allow insert settings" on public.user_settings for insert with check (auth.uid() = id);
create policy "Allow update settings" on public.user_settings for update using (auth.uid() = id);
create policy "Allow delete settings" on public.user_settings for delete using (auth.uid() = id);

-- Watchlist Policies (User ID mapping)
create policy "Allow select watchlist" on public.watchlist for select using (auth.uid() = user_id);
create policy "Allow insert watchlist" on public.watchlist for insert with check (auth.uid() = user_id);
create policy "Allow update watchlist" on public.watchlist for update using (auth.uid() = user_id);
create policy "Allow delete watchlist" on public.watchlist for delete using (auth.uid() = user_id);

-- AI Predictions Policies
create policy "Allow select predictions" on public.ai_predictions for select using (auth.uid() = user_id);
create policy "Allow insert predictions" on public.ai_predictions for insert with check (auth.uid() = user_id);
create policy "Allow update predictions" on public.ai_predictions for update using (auth.uid() = user_id);
create policy "Allow delete predictions" on public.ai_predictions for delete using (auth.uid() = user_id);

-- Trade Journal Policies
create policy "Allow select journal" on public.trade_journal for select using (auth.uid() = user_id);
create policy "Allow insert journal" on public.trade_journal for insert with check (auth.uid() = user_id);
create policy "Allow update journal" on public.trade_journal for update using (auth.uid() = user_id);
create policy "Allow delete journal" on public.trade_journal for delete using (auth.uid() = user_id);

-- AI Analysis Policies
create policy "Allow select analysis" on public.ai_analysis for select using (auth.uid() = user_id);
create policy "Allow insert analysis" on public.ai_analysis for insert with check (auth.uid() = user_id);
create policy "Allow update analysis" on public.ai_analysis for update using (auth.uid() = user_id);
create policy "Allow delete analysis" on public.ai_analysis for delete using (auth.uid() = user_id);

-- Signals Policies
create policy "Allow select signals" on public.signals for select using (auth.uid() = user_id);
create policy "Allow insert signals" on public.signals for insert with check (auth.uid() = user_id);
create policy "Allow update signals" on public.signals for update using (auth.uid() = user_id);
create policy "Allow delete signals" on public.signals for delete using (auth.uid() = user_id);

-- Notifications Policies
create policy "Allow select notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Allow insert notifications" on public.notifications for insert with check (auth.uid() = user_id);
create policy "Allow update notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Allow delete notifications" on public.notifications for delete using (auth.uid() = user_id);

-- Economic Events Policies (Read-only for all authenticated users)
create policy "Allow select events" on public.economic_events for select using (true);
create policy "Allow insert events admin" on public.economic_events for insert with check (false); -- Disable direct client uploads
create policy "Allow update events admin" on public.economic_events for update using (false);
create policy "Allow delete events admin" on public.economic_events for delete using (false);

-- AI Learning Stats Policies
create policy "Allow select learning stats" on public.ai_learning_stats for select using (auth.uid() = user_id);
create policy "Allow insert learning stats" on public.ai_learning_stats for insert with check (auth.uid() = user_id);
create policy "Allow update learning stats" on public.ai_learning_stats for update using (auth.uid() = user_id);
create policy "Allow delete learning stats" on public.ai_learning_stats for delete using (auth.uid() = user_id);

-- ==================================================
-- 4. Triggers Setup (Signup Automation)
-- ==================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Profile Creation
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );

  -- User Settings Creation
  insert into public.user_settings (id, theme, timezone, language, risk_percent, ai_learning_enabled, ml_mode)
  values (new.id, 'dark', 'UTC', 'en', 1.00, true, 'rules_only');

  -- Watchlist Creation (default pairs)
  insert into public.watchlist (user_id, pair, favorite, enabled, priority)
  values 
    (new.id, 'EURUSD', true, true, 1),
    (new.id, 'GBPUSD', false, true, 2),
    (new.id, 'USDJPY', false, true, 3),
    (new.id, 'XAUUSD', true, true, 4),
    (new.id, 'BTCUSD', false, true, 5);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger connection
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==================================================
-- 5. Database Indexes
-- ==================================================
create index idx_profiles_email on public.profiles(email);
create index idx_user_settings_user_id on public.user_settings(id);
create index idx_watchlist_user_id_pair on public.watchlist(user_id, pair);
create index idx_trade_journal_user_id_pair_created on public.trade_journal(user_id, pair, created_at);
create index idx_trade_journal_session on public.trade_journal(session);
create index idx_trade_journal_timeframe on public.trade_journal(timeframe);
create index idx_ai_analysis_user_id_pair_created on public.ai_analysis(user_id, pair, created_at);
create index idx_ai_analysis_killzone on public.ai_analysis(killzone);
create index idx_ai_analysis_session on public.ai_analysis(session);
create index idx_ai_analysis_confidence on public.ai_analysis(confidence);
create index idx_signals_user_id_pair_status on public.signals(user_id, pair, status);
create index idx_signals_score_confidence on public.signals(score, confidence);
create index idx_notifications_user_id_read on public.notifications(user_id, read);
create index idx_economic_events_time on public.economic_events(event_time);
create index idx_ai_predictions_user_id_pair on public.ai_predictions(user_id, pair);
create index idx_ai_learning_stats_user_id_pattern on public.ai_learning_stats(user_id, pattern_type);

-- ==================================================
-- 6. Storage Buckets & Policies Setup
-- ==================================================
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('trade-screenshots', 'trade-screenshots', true),
  ('journal-images', 'journal-images', true)
on conflict (id) do nothing;

-- Avatars Bucket RLS Policies
create policy "Allow select avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Allow insert avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow update avatars" on storage.objects for update with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow delete avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Trade Screenshots Bucket RLS Policies
create policy "Allow select screenshots" on storage.objects for select using (bucket_id = 'trade-screenshots');
create policy "Allow insert screenshots" on storage.objects for insert with check (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow update screenshots" on storage.objects for update with check (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow delete screenshots" on storage.objects for delete using (bucket_id = 'trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Journal Images Bucket RLS Policies
create policy "Allow select journal images" on storage.objects for select using (bucket_id = 'journal-images');
create policy "Allow insert journal images" on storage.objects for insert with check (bucket_id = 'journal-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow update journal images" on storage.objects for update with check (bucket_id = 'journal-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Allow delete journal images" on storage.objects for delete using (bucket_id = 'journal-images' and auth.uid()::text = (storage.foldername(name))[1]);
