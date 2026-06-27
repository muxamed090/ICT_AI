-- ==================================================
-- 1. Create ICT Rules Table
-- ==================================================
create table if not exists public.ict_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  rule_key text not null,
  name text not null,
  description text not null,
  category text not null check (category in ('structure', 'entry', 'liquidity', 'timing', 'trend', 'risk')),
  weight numeric(5,2) default 1.00 not null,
  enabled boolean default true not null,
  conditions jsonb default '{}'::jsonb not null,
  version text default '1.0.0' not null,
  is_default boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, rule_key)
);

-- ==================================================
-- 2. Alter User Settings Table
-- ==================================================
alter table public.user_settings 
add column if not exists signal_threshold numeric(4,2) default 7.00 not null;

-- ==================================================
-- 3. Row Level Security (RLS) Configuration
-- ==================================================
alter table public.ict_rules enable row level security;

-- Policies for ict_rules
create policy "Allow select ict_rules" on public.ict_rules for select using (auth.uid() = user_id);
create policy "Allow insert ict_rules" on public.ict_rules for insert with check (auth.uid() = user_id);
create policy "Allow update ict_rules" on public.ict_rules for update using (auth.uid() = user_id);
create policy "Allow delete ict_rules" on public.ict_rules for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_ict_rules_user_id_key on public.ict_rules(user_id, rule_key);

-- ==================================================
-- 4. Update handle_new_user Signup Trigger
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
  insert into public.user_settings (id, theme, timezone, language, risk_percent, ai_learning_enabled, ml_mode, signal_threshold)
  values (new.id, 'dark', 'UTC', 'en', 1.00, true, 'rules_only', 7.00);

  -- Watchlist Creation (default pairs)
  insert into public.watchlist (user_id, pair, favorite, enabled, priority)
  values 
    (new.id, 'EURUSD', true, true, 1),
    (new.id, 'GBPUSD', false, true, 2),
    (new.id, 'USDJPY', false, true, 3),
    (new.id, 'XAUUSD', true, true, 4),
    (new.id, 'BTCUSD', false, true, 5);

  -- Default ICT Rules Seeding
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

-- ==================================================
-- 5. Seed Rules for existing Mock/Demo User
-- ==================================================
insert into public.ict_rules (user_id, rule_key, name, description, category, weight, enabled, conditions, version, is_default)
values
  ('00000000-0000-0000-0000-000000000000', 'mss_choch', 'Market Structure Shift (MSS/CHoCH)', 'Break of structure or change of character on the trade execution timeframe.', 'structure', 2.00, true, '{"min_displacement_pips": 2.0}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'fvg_retest', 'Fair Value Gap (FVG) Retest', 'Price retesting a valid FVG (BISI or SIBI) within the key zone.', 'entry', 1.50, true, '{"min_fvg_pips": 1.0, "require_displacement": true}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'liquidity_sweep', 'Liquidity Sweep', 'Sweep of key daily, session, or swing high/low liquidity pools.', 'liquidity', 2.00, true, '{"sweep_depth_pips": 0.5}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'killzone_timing', 'Killzone Timing', 'Trade execution aligns strictly with Asia, London, or NY Killzones.', 'timing', 1.00, true, '{"validate_session": true}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'ote_retracement', 'Optimal Trade Entry (OTE)', 'Retracement of price into the 62.0% - 79.0% Fibonacci levels.', 'entry', 1.50, true, '{"fib_levels": [0.62, 0.705, 0.79]}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'htf_bias', 'HTF Trend Bias Alignment', 'Direction matches the Higher Timeframe market structure trend.', 'trend', 2.00, true, '{"htf_timeframe": "4h"}'::jsonb, '1.0.0', true),
  ('00000000-0000-0000-0000-000000000000', 'risk_constraint', 'Risk & Spread Constraint', 'Risk to reward evaluation and spreads check.', 'risk', 1.00, true, '{"max_spread_pips": 2.5, "min_rr_ratio": 2.0}'::jsonb, '1.0.0', true)
on conflict (user_id, rule_key) do nothing;
