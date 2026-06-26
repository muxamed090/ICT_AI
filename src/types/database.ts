// ==================================================
// Database Enum Types (Matching Postgres Enums)
// ==================================================
export type OrderDirection = 'buy' | 'sell'

export type TradingSession = 'asian' | 'london' | 'new_york_am' | 'new_york_pm' | 'london_close'

export type IctKillzone = 'asia' | 'london' | 'new_york' | 'none'

export type MarketBias = 'bullish' | 'bearish' | 'neutral'

export type FvgType = 'bisi' | 'sibi' | 'none'

export type TradeResult = 'win' | 'loss' | 'breakeven' | 'pending'

export type SignalStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'completed'

export type MlMode = 'rules_only' | 'hybrid' | 'ml_priority'

// ==================================================
// Database Table Interfaces
// ==================================================

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  timezone: string
  language: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  theme: string
  timezone: string
  language: string
  notification_enabled: boolean
  telegram_enabled: boolean
  telegram_chat_id: string | null
  risk_percent: number
  ai_learning_enabled: boolean
  ml_mode: MlMode
  created_at: string
  updated_at: string
}

export interface Watchlist {
  id: string
  user_id: string
  pair: string
  favorite: boolean
  enabled: boolean
  priority: number
  created_at: string
}

export interface AiPrediction {
  id: string
  user_id: string
  pair: string
  timeframe: string
  prediction_type: string
  predicted_value: string
  confidence: number
  actual_outcome: string | null
  is_correct: boolean | null
  model_version: string
  features_snapshot: Record<string, unknown>
  created_at: string
}

export interface TradeJournal {
  id: string
  user_id: string
  pair: string
  direction: OrderDirection
  timeframe: string
  session: TradingSession
  killzone: IctKillzone
  setup_type: string
  entry: number
  stop_loss: number
  take_profit: number
  risk_reward: number
  result: TradeResult
  pnl: number
  notes: string | null
  screenshot_url: string | null
  ai_confidence: number | null
  prediction_id: string | null
  created_at: string
}

export interface AiAnalysis {
  id: string
  user_id: string
  pair: string
  timeframe: string
  market_bias: MarketBias
  confluence_score: number
  bos: boolean
  choch: boolean
  order_block_mitigated: boolean
  order_block_price: number | null
  fvg_type: FvgType
  fvg_price: number | null
  liquidity_sweep_high: boolean
  liquidity_sweep_low: boolean
  ote_zone_detected: boolean
  killzone: IctKillzone
  session: TradingSession
  confidence: number
  explanation: string
  model_version: string
  created_at: string
}

export interface Signal {
  id: string
  user_id: string
  pair: string
  direction: OrderDirection
  score: number
  confidence: number
  entry: number
  stop_loss: number
  tp1: number
  tp2: number
  status: SignalStatus
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface EconomicEvent {
  id: string
  event_name: string
  currency: string
  impact: 'low' | 'medium' | 'high'
  event_time: string
  forecast: string | null
  previous: string | null
  actual: string | null
  created_at: string
}

export interface AiLearningStats {
  id: string
  user_id: string
  model_version: string
  pattern_type: string
  total_predictions: number
  correct_predictions: number
  accuracy_rate: number
  avg_confidence: number
  learning_iterations: number
  last_trained_at: string | null
  created_at: string
  updated_at: string
}

// Global Supabase Database Schema mapping
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & Partial<Pick<Profile, 'timezone' | 'language' | 'created_at' | 'updated_at'>>
        Update: Partial<Profile>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'created_at' | 'updated_at'> & Partial<Pick<UserSettings, 'theme' | 'timezone' | 'language' | 'notification_enabled' | 'telegram_enabled' | 'risk_percent' | 'ai_learning_enabled' | 'ml_mode' | 'created_at' | 'updated_at'>>
        Update: Partial<UserSettings>
      }
      watchlist: {
        Row: Watchlist
        Insert: Omit<Watchlist, 'id' | 'created_at'> & Partial<Pick<Watchlist, 'id' | 'favorite' | 'enabled' | 'priority' | 'created_at'>>
        Update: Partial<Watchlist>
      }
      ai_predictions: {
        Row: AiPrediction
        Insert: Omit<AiPrediction, 'id' | 'created_at'> & Partial<Pick<AiPrediction, 'id' | 'actual_outcome' | 'is_correct' | 'features_snapshot' | 'created_at'>>
        Update: Partial<AiPrediction>
      }
      trade_journal: {
        Row: TradeJournal
        Insert: Omit<TradeJournal, 'id' | 'created_at'> & Partial<Pick<TradeJournal, 'id' | 'result' | 'pnl' | 'notes' | 'screenshot_url' | 'ai_confidence' | 'prediction_id' | 'created_at'>>
        Update: Partial<TradeJournal>
      }
      ai_analysis: {
        Row: AiAnalysis
        Insert: Omit<AiAnalysis, 'id' | 'created_at'> & Partial<Pick<AiAnalysis, 'id' | 'market_bias' | 'bos' | 'choch' | 'order_block_mitigated' | 'order_block_price' | 'fvg_type' | 'fvg_price' | 'liquidity_sweep_high' | 'liquidity_sweep_low' | 'ote_zone_detected' | 'created_at'>>
        Update: Partial<AiAnalysis>
      }
      signals: {
        Row: Signal
        Insert: Omit<Signal, 'id' | 'created_at'> & Partial<Pick<Signal, 'id' | 'status' | 'created_at'>>
        Update: Partial<Signal>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'> & Partial<Pick<Notification, 'id' | 'read' | 'created_at'>>
        Update: Partial<Notification>
      }
      economic_events: {
        Row: EconomicEvent
        Insert: Omit<EconomicEvent, 'id' | 'created_at'> & Partial<Pick<EconomicEvent, 'id' | 'forecast' | 'previous' | 'actual' | 'created_at'>>
        Update: Partial<EconomicEvent>
      }
      ai_learning_stats: {
        Row: AiLearningStats
        Insert: Omit<AiLearningStats, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<AiLearningStats, 'id' | 'total_predictions' | 'correct_predictions' | 'accuracy_rate' | 'avg_confidence' | 'learning_iterations' | 'last_trained_at' | 'created_at' | 'updated_at'>>
        Update: Partial<AiLearningStats>
      }
    }
  }
}
