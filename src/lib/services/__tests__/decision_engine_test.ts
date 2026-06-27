import assert from 'assert'
import { MarketSnapshot, IctRule, UserSettings, EconomicEvent } from '@/types/database'
import { TradingCostEngine } from '../TradingCostEngine'
import { PositionSizeCalculator } from '../PositionSizeCalculator'
import { RiskManagementEngine } from '../RiskManagementEngine'
import { AiDecisionEngine } from '../AiDecisionEngine'

console.log('--- RUNNING AI DECISION ENGINE TESTS ---')

// Mock user settings
const mockSettings: UserSettings = {
  id: 'user_1',
  theme: 'dark',
  timezone: 'UTC',
  language: 'en',
  notification_enabled: true,
  telegram_enabled: false,
  telegram_chat_id: null,
  risk_percent: 1.0,
  ai_learning_enabled: true,
  ml_mode: 'rules_only',
  signal_threshold: 7.0,
  max_spread_allowed: 3.0,
  daily_drawdown_limit: 5.0,
  news_buffer_minutes: 30,
  risk_profile: 'balanced',
  ml_confidence_weight: 0.30,
  ml_min_training_samples: 10,
  ml_auto_retrain: true,
  decision_mode: 'hybrid',
  execution_mode: 'confirmation_required',
  trading_environment: 'paper_trading',
  max_trades_per_day: 10,
  enabled_sessions: ['london', 'new_york_am', 'new_york_pm'],
  global_paused: false,
  emergency_stop: false,
  max_slippage_pips: 2.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock rules (seed values)
const mockRules: IctRule[] = [
  { id: '1', user_id: 'user_1', rule_key: 'mss_choch', name: 'MSS/CHoCH', description: '', category: 'structure', weight: 2.0, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' },
  { id: '2', user_id: 'user_1', rule_key: 'fvg_retest', name: 'FVG Retest', description: '', category: 'entry', weight: 1.5, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' },
  { id: '3', user_id: 'user_1', rule_key: 'liquidity_sweep', name: 'Liquidity Sweep', description: '', category: 'liquidity', weight: 2.0, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' },
  { id: '4', user_id: 'user_1', rule_key: 'killzone_timing', name: 'Killzone Timing', description: '', category: 'timing', weight: 1.0, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' },
  { id: '5', user_id: 'user_1', rule_key: 'ote_retracement', name: 'OTE Retrace', description: '', category: 'entry', weight: 1.5, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' },
  { id: '6', user_id: 'user_1', rule_key: 'htf_bias', name: 'HTF Trend Bias', description: '', category: 'trend', weight: 2.0, enabled: true, conditions: {}, version: '1.0.0', is_default: true, created_at: '', updated_at: '' }
]

// Mock snapshots
const entrySnapshot: MarketSnapshot = {
  pair: 'EURUSD',
  timeframe: '15m',
  session: 'london',
  killzone: 'london',
  trend: 'bullish',
  htf_bias: 'bullish',
  fvg_type: 'bisi',
  liquidity_sweep: 'low',
  volume: 'high',
  spread: 1.2,
  bos: true,
  choch: true,
  ote: true
}

// 1. Trading Cost Engine tests
console.log('Testing Trading Cost Engine...')
const costs = TradingCostEngine.calculateExpectedExecutionCost('EURUSD', 1.5, 2.0)
assert.strictEqual(costs.commission, 14.00) // 2 lots * $7
assert.strictEqual(costs.spreadCost, 30.00) // 2 lots * 1.5 spread * $10
assert.strictEqual(costs.totalCost, 44.00)
console.log('✔ Trading Cost Engine passed.')

// 2. Position Size Calculator tests
console.log('Testing Position Size Calculator...')
// Balanced profile: $100k balance @ 1% risk = $1000 risk
const calcBalanced = PositionSizeCalculator.calculate('EURUSD', 'bullish', 1.0, 'balanced', 100000)
assert.strictEqual(calcBalanced.riskAmountUsd, 1000)
assert.strictEqual(calcBalanced.lotSize, 5.0) // $1000 / (20 pips * $10) = 5 lots

// Conservative profile: $100k balance @ 1% base risk * 0.5 multiplier = $500 risk
const calcConservative = PositionSizeCalculator.calculate('EURUSD', 'bullish', 1.0, 'conservative', 100000)
assert.strictEqual(calcConservative.riskAmountUsd, 500)
assert.strictEqual(calcConservative.lotSize, 2.5) // $500 / (20 pips * $10) = 2.5 lots
console.log('✔ Position Size Calculator passed.')

// 3. Risk Management Engine tests
console.log('Testing Risk Management Engine...')
// Spread verification
assert.strictEqual(RiskManagementEngine.checkSpread(1.2, 3.0), true)
assert.strictEqual(RiskManagementEngine.checkSpread(3.5, 3.0), false)

// News verification (15 minutes event time difference)
const newsEvents: EconomicEvent[] = [
  { id: 'e1', event_name: 'CPI Report', currency: 'USD', event_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), impact: 'high', actual: null, previous: null, forecast: null, created_at: '', updated_at: '' }
]
const newsCheck = RiskManagementEngine.checkNewsCollision(new Date().toISOString(), newsEvents, 30)
assert.strictEqual(newsCheck.isSafe, false)
assert.ok(newsCheck.collidingEvent?.includes('CPI Report'))
console.log('✔ Risk Management Engine passed.')

// 4. AI Decision Engine Coordinator Pipeline tests
console.log('Testing AI Decision Engine Coordinator...')
// Case A: Perfect snapshot, balanced settings, safe environment -> ENTRY decision
const resultA = AiDecisionEngine.evaluate(entrySnapshot, mockRules, mockSettings, [], 100000, 0.0)
assert.strictEqual(resultA.decision, 'ENTRY')
assert.strictEqual(resultA.confluenceScore, 10.0) // All rules trigger
assert.ok(resultA.decisionTrace.includes('[Done] Confluence decision resolved to: ENTRY'))

// Case B: High confluence but news event collision -> WAIT decision
const resultB = AiDecisionEngine.evaluate(entrySnapshot, mockRules, mockSettings, newsEvents, 100000, 0.0)
assert.strictEqual(resultB.decision, 'WAIT')
assert.ok(resultB.reasons.some(r => r.includes('news event collision')))

// Case C: Drawdown exceeded -> WAIT decision
const resultC = AiDecisionEngine.evaluate(entrySnapshot, mockRules, mockSettings, [], 100000, 6.0) // 6.0% active drawdown > 5.0% limit
assert.strictEqual(resultC.decision, 'WAIT')
assert.ok(resultC.reasons.some(r => r.includes('drawdown limit exceeded')))

// Case D: Low confluence -> IGNORE decision
const poorSnapshot: MarketSnapshot = { ...entrySnapshot, bos: false, choch: false, ote: false, fvg_type: 'none', liquidity_sweep: 'none' }
const resultD = AiDecisionEngine.evaluate(poorSnapshot, mockRules, mockSettings, [], 100000, 0.0)
assert.strictEqual(resultD.decision, 'IGNORE')
console.log('✔ AI Decision Engine Coordinator passed.')

console.log('--- ALL AI DECISION ENGINE TESTS PASSED ---')
