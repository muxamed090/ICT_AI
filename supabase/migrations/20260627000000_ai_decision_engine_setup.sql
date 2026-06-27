-- ==================================================
-- 1. Alter User Settings Table
-- ==================================================
alter table public.user_settings 
add column if not exists max_spread_allowed numeric(4,2) default 3.00 not null,
add column if not exists daily_drawdown_limit numeric(4,2) default 5.00 not null,
add column if not exists news_buffer_minutes integer default 30 not null,
add column if not exists risk_profile text default 'balanced' not null check (risk_profile in ('conservative', 'balanced', 'aggressive'));

-- ==================================================
-- 2. Create AI Decisions History Table
-- ==================================================
create table if not exists public.ai_decisions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  snapshot jsonb not null default '{}'::jsonb,
  decision_result jsonb not null default '{}'::jsonb,
  model_version text not null default 'ICT-AI-v1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configure RLS
alter table public.ai_decisions enable row level security;

-- Policies for ai_decisions
create policy "Allow select ai_decisions" on public.ai_decisions for select using (auth.uid() = user_id);
create policy "Allow insert ai_decisions" on public.ai_decisions for insert with check (auth.uid() = user_id);
create policy "Allow delete ai_decisions" on public.ai_decisions for delete using (auth.uid() = user_id);

-- Performance Index
create index if not exists idx_ai_decisions_user_id_created on public.ai_decisions(user_id, created_at desc);

-- ==================================================
-- 3. Update handle_new_user Signup Trigger
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

  -- User Settings Creation with Phase 8 & 9 extensions
  insert into public.user_settings (
    id, 
    theme, 
    timezone, 
    language, 
    risk_percent, 
    ai_learning_enabled, 
    ml_mode, 
    signal_threshold,
    max_spread_allowed,
    daily_drawdown_limit,
    news_buffer_minutes,
    risk_profile
  )
  values (
    new.id, 
    'dark', 
    'UTC', 
    'en', 
    1.00, 
    true, 
    'rules_only', 
    7.00,
    3.00,
    5.00,
    30,
    'balanced'
  );

  -- Watchlist Creation (default pairs)
  insert into public.watchlist (user_id, pair, favorite, enabled, priority)
  values 
    (new.id, 'EURUSD', true, true, 1),
    (new.id, 'GBPUSD', false, true, 2),
    (new.id, 'USDJPY', false, true, 3),
    (new.id, 'XAUUSD', true, true, 4),
    (new.id, 'BTCUSD', false, true, 5);

  -- Default ICT Rules Seeding (Phase 8 seed fallback)
  insert into public.ict_rules (user_id, rule_key, name, description, category, weight, enabled, conditions, version, is_default)
  values
    (new.id, 'mss_choch', 'Market Structure Shift (MSS/CHoCH)', 'Break of structure or change of character on the trade execution timeframe.', 'structure', 2.00, true, '{"min_displacement_pips": 2.0}'::jsonb, '1.0.0', true),
    (new.id, 'fvg_retest', 'Fair Value Gap (FVG) Retest', 'Price retesting a valid FVG (BISI or SIBI) within the key zone.', 'entry', 1.50, true, '{"min_fvg_pips": 1.0, "require_displacement": true}'::jsonb, '1.0.0', true),
    (new.id, 'liquidity_sweep', 'Liquidity Sweep', 'Sweep of key daily, session, or swing high/low liquidity pools.', 'liquidity', 2.00, true, '{"sweep_depth_pips": 0.5}'::jsonb, '1.0.0', true),
    (new.id, 'killzone_timing', 'Killzone Timing', 'Trade execution aligns strictly with Asia, London, or NY Killzones.', 'timing', 1.00, true, '{"validate_session": true}'::jsonb, '1.0.0', true),
    (new.id, 'ote_retracement', 'Optimal Trade Entry (OTE)', 'Retracement of price into the 62.0% - 79.0% Fibonacci levels.', 'entry', 1.50, true, '{"fib_levels": [0.62, 0.705, 0.79]}'::jsonb, '1.0.0', true),
    (new.id, 'htf_bias', 'HTF Trend Bias Alignment', 'Direction matches the Higher Timeframe market structure trend.', 'trend', 2.00, true, '{"htf_timeframe": "4h"}'::jsonb, '1.0.0', true),
    (new.id, 'risk_constraint', 'Risk & Spread Constraint', 'Risk to reward evaluation and spreads check.', 'risk', 1.00, true, '{"max_spread_pips": 2.5, "min_rr_ratio": 2.0}'::jsonb, '1.0.0', true);

  return new;
end;
$$ language plpgsql security definer;
