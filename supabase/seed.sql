-- Create a mock user in auth.users if none exists
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
values (
  '00000000-0000-0000-0000-000000000000',
  'demo@ict-ai-trader.com',
  '$2a$10$7vNfQ5Vj6xVb1e6W4uQZ6.k212E6P1GzYVw/SgD8fN4H4R5N5M2m.', -- pre-encrypted hash for 'password123'
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Trader"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
)
on conflict (id) do nothing;

-- ==================================================
-- 1. Mock Economic Events (Global Calendar)
-- ==================================================
insert into public.economic_events (id, event_name, currency, impact, event_time, forecast, previous, actual)
values 
  (gen_random_uuid(), 'USD FOMC Federal Funds Rate', 'USD', 'high', now() + interval '2 hours', '5.50%', '5.50%', null),
  (gen_random_uuid(), 'EUR CPI Flash Estimate y/y', 'EUR', 'medium', now() - interval '4 hours', '2.6%', '2.4%', '2.6%'),
  (gen_random_uuid(), 'GBP Unemployment Rate', 'GBP', 'high', now() + interval '1 day', '4.2%', '4.3%', null),
  (gen_random_uuid(), 'USD Core Retail Sales m/m', 'USD', 'medium', now() - interval '1 day', '0.2%', '0.1%', '0.3%')
on conflict (id) do nothing;

-- ==================================================
-- 2. Mock AI Predictions (Future ML snaps)
-- ==================================================
insert into public.ai_predictions (id, user_id, pair, timeframe, prediction_type, predicted_value, confidence, actual_outcome, is_correct, model_version, features_snapshot)
values 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'EURUSD',
    '15m',
    'direction',
    'bullish',
    84.50,
    'win',
    true,
    'ICT-Net v2.4r',
    '{"dxy_structure": "bearish", "fvg_aligned": true, "mss_depth": "medium"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'GBPUSD',
    '5m',
    'direction',
    'bullish',
    78.20,
    'win',
    true,
    'ICT-Net v2.4r',
    '{"dxy_structure": "bearish", "fvg_aligned": true, "mss_depth": "shallow"}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'AUDUSD',
    '1h',
    'direction',
    'bullish',
    62.40,
    'loss',
    false,
    'ICT-Net v2.3',
    '{"dxy_structure": "neutral", "fvg_aligned": false, "mss_depth": "deep"}'::jsonb
  )
on conflict (id) do nothing;

-- ==================================================
-- 3. Mock Trade Journal
-- ==================================================
insert into public.trade_journal (id, user_id, pair, direction, timeframe, session, killzone, setup_type, entry, stop_loss, take_profit, risk_reward, result, pnl, notes, screenshot_url, ai_confidence, prediction_id)
values 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'EURUSD',
    'buy',
    '15m',
    'london',
    'london',
    'MSS Breakout + FVG Retest',
    1.08320,
    1.08150,
    1.08800,
    2.82,
    'win',
    195.00,
    'Perfect entry inside London killzone. Price tapped FVG and immediate rejection.',
    null,
    84.50,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'GBPUSD',
    'buy',
    '5m',
    'new_york_am',
    'new_york',
    'Liquidity Sweep + CHoCH',
    1.26910,
    1.26820,
    1.27200,
    3.22,
    'win',
    90.00,
    'Price swept daily low, registered a quick CHoCH on 1m, entered at FVG retest.',
    null,
    78.20,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'AUDUSD',
    'buy',
    '1h',
    'asian',
    'asia',
    'Asia Range Breakout',
    0.65420,
    0.65200,
    0.65900,
    2.18,
    'loss',
    -20.00,
    'Entered breakout but DXY bullish momentum forced reverse. Hit stop loss.',
    null,
    62.40,
    '33333333-3333-3333-3333-333333333333'
  )
on conflict (id) do nothing;

-- ==================================================
-- 4. Mock AI Analysis Logs
-- ==================================================
insert into public.ai_analysis (id, user_id, pair, timeframe, market_bias, confluence_score, bos, choch, order_block_mitigated, order_block_price, fvg_type, fvg_price, liquidity_sweep_high, liquidity_sweep_low, ote_zone_detected, killzone, session, confidence, explanation, model_version)
values 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'EURUSD',
    '15m',
    'bullish',
    8.5,
    true,
    true,
    false,
    1.08250,
    'bisi',
    1.08310,
    false,
    true,
    true,
    'london',
    'london',
    84.50,
    'Bullish shift confirmed by displacement. Price swept lower liquidity pool. Confluence rate includes OTE alignment and discount FVG presence.',
    'ICT-Net v2.4r'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'GBPUSD',
    '5m',
    'bullish',
    7.8,
    false,
    true,
    true,
    1.26700,
    'bisi',
    1.26800,
    true,
    true,
    false,
    'new_york',
    'new_york_am',
    78.20,
    'Minor CHoCH structural break. Swept both buy/sell liquidity. Premium order block partially mitigated.',
    'ICT-Net v2.4r'
  )
on conflict (id) do nothing;

-- ==================================================
-- 5. Mock Signals alerts
-- ==================================================
insert into public.signals (id, user_id, pair, direction, score, confidence, entry, stop_loss, tp1, tp2, status)
values 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'EURUSD', 'buy', 8.50, 84.50, 1.08320, 1.08150, 1.08600, 1.08800, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'GBPUSD', 'buy', 7.80, 78.20, 1.26910, 1.26820, 1.27100, 1.27200, 'completed'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'USDJPY', 'sell', 6.20, 61.50, 156.200, 156.650, 155.800, 155.400, 'expired')
on conflict (id) do nothing;

-- ==================================================
-- 6. Mock Notifications
-- ==================================================
insert into public.notifications (id, user_id, type, title, message, read)
values 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'signal', 'EURUSD Buy Signal Alert', 'AI Engine flagged bullish Market Structure Shift on EURUSD 15m. Entry zone at 1.08320.', false),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'system', 'Engine Sync Succeeded', 'ICT AI modeller successfully sync with global FX feed.', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'economic', 'High Impact FOMC Rate Decision', 'FOMC Interest Rate announcement is scheduled in 2 hours.', false)
on conflict (id) do nothing;

-- ==================================================
-- 7. Mock AI Learning statistics
-- ==================================================
insert into public.ai_learning_stats (id, user_id, model_version, pattern_type, total_predictions, correct_predictions, accuracy_rate, avg_confidence, learning_iterations, last_trained_at)
values 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'ICT-Net v2.4r', 'FVG Retest Fill', 140, 112, 80.00, 82.30, 4, now() - interval '3 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'ICT-Net v2.4r', 'MSS Breakout Validation', 95, 78, 82.10, 79.50, 3, now() - interval '4 days')
on conflict (id) do nothing;
