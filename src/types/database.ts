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
  signal_threshold: number
  max_spread_allowed: number
  daily_drawdown_limit: number
  news_buffer_minutes: number
  risk_profile: 'conservative' | 'balanced' | 'aggressive'
  ml_confidence_weight: number
  ml_min_training_samples: number
  ml_auto_retrain: boolean
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
        Insert: Omit<UserSettings, 'created_at' | 'updated_at' | 'signal_threshold' | 'max_spread_allowed' | 'daily_drawdown_limit' | 'news_buffer_minutes' | 'risk_profile'> & Partial<Pick<UserSettings, 'theme' | 'timezone' | 'language' | 'notification_enabled' | 'telegram_enabled' | 'risk_percent' | 'ai_learning_enabled' | 'ml_mode' | 'signal_threshold' | 'max_spread_allowed' | 'daily_drawdown_limit' | 'news_buffer_minutes' | 'risk_profile' | 'created_at' | 'updated_at'>>
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
      ict_rules: {
        Row: IctRule
        Insert: Omit<IctRule, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<IctRule, 'id' | 'weight' | 'enabled' | 'conditions' | 'version' | 'is_default' | 'created_at' | 'updated_at'>>
        Update: Partial<IctRule>
      }
      ai_decisions: {
        Row: AiDecision
        Insert: Omit<AiDecision, 'id' | 'created_at'> & Partial<Pick<AiDecision, 'id' | 'model_version' | 'created_at'>>
        Update: Partial<AiDecision>
      }
      ml_model_registry: {
        Row: MlModelRegistry
        Insert: Omit<MlModelRegistry, 'id' | 'created_at' | 'trained_at'> & Partial<Pick<MlModelRegistry, 'id' | 'is_active' | 'trained_at' | 'created_at'>>
        Update: Partial<MlModelRegistry>
      }
      ml_predictions: {
        Row: MlPrediction
        Insert: Omit<MlPrediction, 'id' | 'created_at' | 'actual_outcome' | 'is_correct' | 'outcome_linked_at'> & Partial<Pick<MlPrediction, 'id' | 'actual_outcome' | 'is_correct' | 'outcome_linked_at' | 'created_at'>>
        Update: Partial<MlPrediction>
      }
      backtest_runs: {
        Row: BacktestRun
        Insert: Omit<BacktestRun, 'id' | 'created_at'> & Partial<Pick<BacktestRun, 'id' | 'description' | 'pair_filter' | 'session_filter' | 'sharpe_ratio' | 'created_at'>>
        Update: Partial<BacktestRun>
      }
      backtest_trades: {
        Row: BacktestTrade
        Insert: Omit<BacktestTrade, 'id' | 'created_at'> & Partial<Pick<BacktestTrade, 'id' | 'journal_id' | 'ict_score' | 'ml_score' | 'final_score' | 'ai_decision' | 'ai_confidence' | 'created_at'>>
        Update: Partial<BacktestTrade>
      }
    }
  }
}

// ==================================================
// ICT Rules Engine & Simulator Custom Types
// ==================================================

export type IctRuleCategory = 'structure' | 'entry' | 'liquidity' | 'timing' | 'trend' | 'risk'

export interface IctRule {
  id: string
  user_id: string
  rule_key: string
  name: string
  description: string
  category: IctRuleCategory
  weight: number
  enabled: boolean
  conditions: Record<string, unknown>
  version: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface MarketSnapshot {
  pair: string
  timeframe: string
  session: TradingSession
  killzone: IctKillzone
  trend: 'bullish' | 'bearish' | 'ranging'
  bos: boolean
  choch: boolean
  fvg_type: FvgType
  ote: boolean
  liquidity_sweep: 'high' | 'low' | 'none'
  htf_bias: MarketBias
  volume: 'high' | 'average' | 'low'
  spread: number
}

export interface RuleResult {
  ruleKey: string
  name: string
  category: IctRuleCategory
  weight: number
  enabled: boolean
  isTriggered: boolean
  scoreContribution: number
}

export interface EngineResult {
  confluenceScore: number
  confidence: number
  marketBias: 'bullish' | 'bearish' | 'neutral'
  triggeredRules: RuleResult[]
  explanation: string
  recommendation: 'WAIT' | 'WATCH' | 'ENTRY'
}

export type DecisionType = 'ENTRY' | 'WATCH' | 'WAIT' | 'IGNORE'

export interface RiskEvaluation {
  isSpreadOk: boolean
  isNewsSafe: boolean
  isDrawdownOk: boolean
  activeDrawdown: number
  collidingNewsEvent: string | null
}

export interface PositionCalculation {
  lotSize: number
  riskAmountUsd: number
  entryPrice: number
  stopLossPrice: number
  tp1: number
  tp2: number
  stopLossPips: number
}

export interface TradingCost {
  spreadCost: number
  commission: number
  totalCost: number
}

export interface DecisionResult {
  decision: DecisionType
  confluenceScore: number
  confidence: number
  marketBias: MarketBias
  riskEvaluation: RiskEvaluation
  positionCalculation: PositionCalculation | null
  tradingCost: TradingCost
  reasons: string[]
  decisionTrace: string[]
}

export interface AiDecision {
  id: string
  user_id: string
  snapshot: Record<string, unknown>
  decision_result: Record<string, unknown>
  model_version: string
  created_at: string
}

// ==================================================
// Phase 10 — Machine Learning Engine Types
// ==================================================

export type MlRecommendation = 'ENTRY' | 'WATCH' | 'WAIT' | 'IGNORE'

/** Versioned, immutable ML model snapshot stored in ml_model_registry */
export interface MlModelRegistry {
  id: string
  user_id: string
  model_version: string
  ml_mode: MlMode
  rule_weights: Record<string, unknown>
  pattern_stats: Record<string, unknown>
  training_samples: number
  accuracy_rate: number
  avg_confidence: number
  is_active: boolean
  trained_at: string
  created_at: string
}

/** One ML inference recorded per ai_decision; outcome linked back later */
export interface MlPrediction {
  id: string
  user_id: string
  ai_decision_id: string | null
  model_version: string
  pair: string
  timeframe: string
  session: string
  ml_score: number
  ml_confidence: number
  ml_bias: MarketBias
  ml_recommendation: MlRecommendation
  feature_vector: Record<string, unknown>
  actual_outcome: string | null
  is_correct: boolean | null
  outcome_linked_at: string | null
  created_at: string
}

/** Normalized feature vector passed to the ML Inference Engine */
export interface MlFeatureVector {
  pair: string
  timeframe: string
  session: TradingSession
  killzone: IctKillzone
  htf_bias: MarketBias
  trend: 'bullish' | 'bearish' | 'ranging'
  bos: boolean
  choch: boolean
  fvg_type: FvgType
  ote: boolean
  liquidity_sweep: 'high' | 'low' | 'none'
  volume: 'high' | 'average' | 'low'
  spread: number
  ict_confluence_score: number
  ict_confidence: number
  triggered_rule_count: number
  total_rule_count: number
}

/** Per-rule accuracy weight produced by FeatureWeightCalibrator */
export interface RuleAccuracyWeight {
  ruleKey: string
  totalSamples: number
  correctSamples: number
  accuracyRate: number
  calibratedWeight: number
}

/** Per-pair/session accuracy statistics from PatternAccuracyTracker */
export interface PatternStat {
  pair: string
  session: string
  totalPredictions: number
  correctPredictions: number
  accuracyRate: number
  avgMlScore: number
}

/** Output of MlInferenceEngine — consumed by AiDecisionEngine */
export interface MlInferenceResult {
  mlScore: number
  mlConfidence: number
  mlBias: MarketBias
  mlRecommendation: MlRecommendation
  confidenceBoost: number
  appliedModelVersion: string
  inferenceTrace: string[]
}

/** Extended DecisionResult with ML layer output */
export interface HybridDecisionResult extends DecisionResult {
  mlInference: MlInferenceResult | null
  finalScore: number
  mlModelVersion: string
}

/** Input payload for training action */
export interface MlTrainingInput {
  mlMode: MlMode
  minSamples: number
}

/** Summary output of a completed ML training cycle */
export interface MlTrainingResult {
  modelVersion: string
  trainingSamples: number
  accuracyRate: number
  ruleWeights: RuleAccuracyWeight[]
  patternStats: PatternStat[]
  durationMs: number
}

// ==================================================
// Phase 11 — Backtesting Engine Types
// ==================================================

export type BacktestStatus = 'running' | 'completed' | 'failed'

export interface BacktestRun {
  id: string
  user_id: string
  name: string
  description: string | null
  ml_mode: MlMode
  model_version: string
  rules_engine_version: string
  decision_engine_version: string
  ml_engine_version: string
  date_from: string
  date_to: string
  pair_filter: string[] | null
  session_filter: string[] | null
  total_trades: number
  winning_trades: number
  losing_trades: number
  breakeven_trades: number
  win_rate: number
  loss_rate: number
  profit_factor: number
  expectancy: number
  avg_rr: number
  net_pnl: number
  gross_profit: number
  gross_loss: number
  max_drawdown: number
  max_drawdown_pct: number
  sharpe_ratio: number | null
  report: Record<string, unknown>
  status: BacktestStatus
  created_at: string
}

export interface BacktestTrade {
  id: string
  backtest_run_id: string
  user_id: string
  journal_id: string | null
  pair: string
  direction: OrderDirection
  session: TradingSession
  killzone: IctKillzone
  setup_type: string
  timeframe: string
  entry_price: number
  stop_loss: number
  take_profit: number
  risk_reward: number
  result: TradeResult
  pnl: number
  ict_score: number | null
  ml_score: number | null
  final_score: number | null
  ai_decision: DecisionType | null
  ai_confidence: number | null
  running_equity: number
  running_drawdown: number
  trade_index: number
  traded_at: string
  created_at: string
}

export interface BacktestConfig {
  name: string
  description: string
  mlMode: MlMode
  dateFrom: string
  dateTo: string
  pairFilter: string[]
  sessionFilter: TradingSession[]
  initialEquity: number
  minSampleSize: number
}

// Monte Carlo Analysis Types
export interface MonteCarloSimulationRun {
  runIndex: number
  finalEquity: number
  maxDrawdownPct: number
  netPnl: number
}

export interface MonteCarloResult {
  simulationsCount: number
  worstDrawdownPct: number
  bestEquity: number
  medianReturn: number
  averageReturn: number
  probabilityOfProfit: number
  runs: MonteCarloSimulationRun[]
}

// Walk-Forward Analysis Types
export interface WalkForwardWindow {
  windowIndex: number
  trainFrom: string
  trainTo: string
  testFrom: string
  testTo: string
  inSampleWinRate: number
  outOfSampleWinRate: number
  efficiencyRatio: number
}

export interface WalkForwardResult {
  totalWindows: number
  avgEfficiencyRatio: number
  robustnessScore: number
  windows: WalkForwardWindow[]
}

// Strategy Comparison Types
export interface StrategyComparisonItem {
  runId: string
  name: string
  mlMode: MlMode
  modelVersion: string
  winRate: number
  profitFactor: number
  sharpeRatio: number | null
  expectancy: number
  maxDrawdownPct: number
  netPnl: number
  totalTrades: number
}

export interface StrategyComparisonResult {
  items: StrategyComparisonItem[]
}

// Headline Performance & Report Types
export interface EquityPoint {
  tradeIndex: number
  tradedAt: string
  equity: number
  pnl: number
  pair: string
  result: TradeResult
}

export interface DrawdownPoint {
  tradeIndex: number
  tradedAt: string
  drawdown: number
  drawdownPct: number
  equity: number
}

export interface DrawdownPeriod {
  startIndex: number
  endIndex: number
  startAt: string
  endAt: string | null
  peakEquity: number
  troughEquity: number
  maxDrawdownPct: number
  tradesInDrawdown: number
  recoveredAt: string | null
}


export interface PeriodPerformance {
  period: string
  periodType: 'daily' | 'weekly' | 'monthly'
  trades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  profitFactor: number
}

export interface PairStat {
  pair: string
  trades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  avgRR: number
  profitFactor: number
  expectancy: number
}

export interface SessionStat {
  session: TradingSession
  trades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  profitFactor: number
  avgRR: number
}

export interface IctSetupStat {
  setupType: string
  trades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  avgRR: number
}

export interface MlAccuracyMetrics {
  totalPredictions: number
  correctPredictions: number
  accuracyRate: number
  avgMlScore: number
  avgConfidence: number
}

export interface AiDecisionMetrics {
  totalDecisions: number
  entryDecisions: number
  entryWins: number
  entryWinRate: number
  watchDecisions: number
  waitDecisions: number
  ignoreDecisions: number
  avgConfluenceScore: number
}

export interface BacktestReport {
  runId: string
  config: BacktestConfig
  engineVersions: {
    rulesEngine: string
    decisionEngine: string
    mlEngine: string
  }
  totalTrades: number
  winningTrades: number
  losingTrades: number
  breakevenTrades: number
  winRate: number
  lossRate: number
  profitFactor: number
  expectancy: number
  avgRR: number
  netPnl: number
  grossProfit: number
  grossLoss: number
  maxDrawdown: number
  maxDrawdownPct: number
  sharpeRatio: number | null
  equityCurve: EquityPoint[]
  drawdownCurve: DrawdownPoint[]
  dailyPerformance: PeriodPerformance[]
  weeklyPerformance: PeriodPerformance[]
  monthlyPerformance: PeriodPerformance[]
  pairStats: PairStat[]
  sessionStats: SessionStat[]
  ictSetupStats: IctSetupStat[]
  mlAccuracy: MlAccuracyMetrics
  aiDecisionMetrics: AiDecisionMetrics
  monteCarlo?: MonteCarloResult
  walkForward?: WalkForwardResult
  generatedAt: string
  durationMs: number
}
