import { z } from 'zod'

// 1. Profile Validator
export const profileSchema = z.object({
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required'),
})

// 2. User Settings Validator
export const userSettingsSchema = z.object({
  theme: z.string().min(1),
  timezone: z.string().min(1),
  language: z.string().min(1),
  notification_enabled: z.boolean(),
  telegram_enabled: z.boolean(),
  telegram_chat_id: z.string().nullable().optional(),
  risk_percent: z.number().min(0.01).max(100.00),
  ai_learning_enabled: z.boolean(),
  ml_mode: z.enum(['rules_only', 'hybrid', 'ml_priority']),
  signal_threshold: z.number().min(0.0).max(10.0),
  max_spread_allowed: z.number().min(0.0).max(100.0),
  daily_drawdown_limit: z.number().min(0.0).max(100.0),
  news_buffer_minutes: z.number().int().nonnegative(),
  risk_profile: z.enum(['conservative', 'balanced', 'aggressive']),
  ml_confidence_weight: z.number().min(0.0).max(1.0),
  ml_min_training_samples: z.number().int().min(1).max(1000),
  ml_auto_retrain: z.boolean(),
})

// 2a. ICT Rules Validator
export const ictRuleSchema = z.object({
  weight: z.number().min(0.1).max(10.0),
  enabled: z.boolean(),
  conditions: z.record(z.string(), z.unknown()).optional(),
})

// 2b. Confluence Simulation Snapshot Validator
export const marketSnapshotSchema = z.object({
  pair: z.string().min(1, 'Trading pair is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  session: z.enum(['asian', 'london', 'new_york_am', 'new_york_pm', 'london_close']),
  killzone: z.enum(['asia', 'london', 'new_york', 'none']),
  trend: z.enum(['bullish', 'bearish', 'ranging']),
  bos: z.boolean(),
  choch: z.boolean(),
  fvg_type: z.enum(['bisi', 'sibi', 'none']),
  ote: z.boolean(),
  liquidity_sweep: z.enum(['high', 'low', 'none']),
  htf_bias: z.enum(['bullish', 'bearish', 'neutral']),
  volume: z.enum(['high', 'average', 'low']),
  spread: z.number().nonnegative(),
})

// 3. Watchlist Validator
export const watchlistSchema = z.object({
  pair: z.string().min(1, 'Trading pair is required'),
  favorite: z.boolean().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
})

// 4. Trade Journal Validator
export const tradeJournalSchema = z.object({
  pair: z.string().min(1, 'Trading pair is required'),
  direction: z.enum(['buy', 'sell']),
  timeframe: z.string().min(1, 'Timeframe is required'),
  session: z.enum(['asian', 'london', 'new_york_am', 'new_york_pm', 'london_close']),
  killzone: z.enum(['asia', 'london', 'new_york', 'none']),
  setup_type: z.string().min(1, 'Setup type is required'),
  entry: z.number().positive('Entry price must be positive'),
  stop_loss: z.number().positive('Stop loss price must be positive'),
  take_profit: z.number().positive('Take profit price must be positive'),
  risk_reward: z.number().positive('Risk-to-reward ratio must be positive'),
  result: z.enum(['win', 'loss', 'breakeven', 'pending']).optional(),
  pnl: z.number().optional(),
  notes: z.string().nullable().optional(),
  screenshot_url: z.string().nullable().optional(),
  ai_confidence: z.number().min(0).max(100).nullable().optional(),
  prediction_id: z.string().uuid().nullable().optional(),
})

// 5. AI Analysis Validator
export const aiAnalysisSchema = z.object({
  pair: z.string().min(1, 'Trading pair is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  market_bias: z.enum(['bullish', 'bearish', 'neutral']),
  confluence_score: z.number().min(0).max(100),
  bos: z.boolean().optional(),
  choch: z.boolean().optional(),
  order_block_mitigated: z.boolean().optional(),
  order_block_price: z.number().nullable().optional(),
  fvg_type: z.enum(['bisi', 'sibi', 'none']),
  fvg_price: z.number().nullable().optional(),
  liquidity_sweep_high: z.boolean().optional(),
  liquidity_sweep_low: z.boolean().optional(),
  ote_zone_detected: z.boolean().optional(),
  killzone: z.enum(['asia', 'london', 'new_york', 'none']),
  session: z.enum(['asian', 'london', 'new_york_am', 'new_york_pm', 'london_close']),
  confidence: z.number().min(0).max(100),
  explanation: z.string().min(1, 'Explanation text is required'),
  model_version: z.string().min(1, 'Model version label is required'),
})

// 6. Signals Validator
export const signalSchema = z.object({
  pair: z.string().min(1, 'Trading pair is required'),
  direction: z.enum(['buy', 'sell']),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  entry: z.number().positive('Entry price must be positive'),
  stop_loss: z.number().positive('Stop loss price must be positive'),
  tp1: z.number().positive('TP1 price must be positive'),
  tp2: z.number().positive('TP2 price must be positive'),
  status: z.enum(['pending', 'active', 'expired', 'cancelled', 'completed']).optional(),
})

// 7. Notifications Validator
export const notificationSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  read: z.boolean().optional(),
})

// 8. Economic Events Validator
export const economicEventSchema = z.object({
  event_name: z.string().min(1),
  currency: z.string().min(1),
  impact: z.enum(['low', 'medium', 'high']),
  event_time: z.string().datetime(),
  forecast: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
  actual: z.string().nullable().optional(),
})

// 9. ML Training Input Validator
export const mlTrainingInputSchema = z.object({
  mlMode: z.enum(['rules_only', 'hybrid', 'ml_priority']),
  minSamples: z.number().int().min(1),
})

// 10. ML Outcome Linking Validator
export const mlOutcomeLinkSchema = z.object({
  mlPredictionId: z.string().uuid(),
  actualOutcome: z.enum(['win', 'loss', 'breakeven']),
  isCorrect: z.boolean(),
})
