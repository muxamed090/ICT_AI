// Pure Node unit test script to verify UI-Agnostic Rules Engine
import { IctRulesEngine } from '../IctRulesEngine'
import { MarketSnapshot, IctRule } from '@/types/database'

// Mock Rules Config
const mockRules: IctRule[] = [
  {
    id: '1',
    user_id: 'test',
    rule_key: 'mss_choch',
    name: 'Market Structure Shift',
    description: 'BOS/CHoCH',
    category: 'structure',
    weight: 2.00,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '2',
    user_id: 'test',
    rule_key: 'fvg_retest',
    name: 'Fair Value Gap',
    description: 'FVG Retest',
    category: 'entry',
    weight: 1.50,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '3',
    user_id: 'test',
    rule_key: 'liquidity_sweep',
    name: 'Liquidity Sweep',
    description: 'Sweep',
    category: 'liquidity',
    weight: 2.00,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '4',
    user_id: 'test',
    rule_key: 'killzone_timing',
    name: 'Killzone Timing',
    description: 'Killzone',
    category: 'timing',
    weight: 1.00,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '5',
    user_id: 'test',
    rule_key: 'ote_retracement',
    name: 'Optimal Trade Entry',
    description: 'OTE',
    category: 'entry',
    weight: 1.50,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '6',
    user_id: 'test',
    rule_key: 'htf_bias',
    name: 'HTF Trend Bias Alignment',
    description: 'HTF Bias',
    category: 'trend',
    weight: 2.00,
    enabled: true,
    conditions: {},
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: '7',
    user_id: 'test',
    rule_key: 'risk_constraint',
    name: 'Risk & Spread Constraint',
    description: 'Risk check',
    category: 'risk',
    weight: 1.00,
    enabled: true,
    conditions: { max_spread_pips: 2.5 },
    version: '1.0.0',
    is_default: true,
    created_at: '',
    updated_at: ''
  }
]

// Test Case 1: High Confluence Bullish Setup (All rules triggered)
const testSnapshot1: MarketSnapshot = {
  pair: 'EURUSD',
  timeframe: '15m',
  session: 'london',
  killzone: 'london',
  trend: 'bullish',
  bos: true,
  choch: true,
  fvg_type: 'bisi',
  ote: true,
  liquidity_sweep: 'low',
  htf_bias: 'bullish',
  volume: 'high',
  spread: 1.2
}

// Test Case 2: Low Confluence / Ranging market
const testSnapshot2: MarketSnapshot = {
  pair: 'GBPUSD',
  timeframe: '1h',
  session: 'asian',
  killzone: 'none',
  trend: 'ranging',
  bos: false,
  choch: false,
  fvg_type: 'none',
  ote: false,
  liquidity_sweep: 'none',
  htf_bias: 'neutral',
  volume: 'low',
  spread: 3.5
}

function runTests() {
  console.log('--- RUNNING ICT RULES ENGINE TESTS ---')

  // Execute Case 1
  console.log('\nEvaluating Test Case 1 (All factors aligned, bullish)...')
  const result1 = IctRulesEngine.evaluate(testSnapshot1, mockRules, 7.00)
  console.log(`Confluence Score: ${result1.confluenceScore} (Expected: 10.0)`)
  console.log(`Confidence: ${result1.confidence}% (Expected: 100%)`)
  console.log(`Market Bias: ${result1.marketBias} (Expected: bullish)`)
  console.log(`Recommendation: ${result1.recommendation} (Expected: ENTRY)`)
  
  if (result1.confluenceScore === 10 && result1.recommendation === 'ENTRY' && result1.marketBias === 'bullish') {
    console.log('🟢 TEST CASE 1 PASSED')
  } else {
    console.error('🔴 TEST CASE 1 FAILED')
  }

  // Execute Case 2
  console.log('\nEvaluating Test Case 2 (No factors aligned, ranging)...')
  const result2 = IctRulesEngine.evaluate(testSnapshot2, mockRules, 7.00)
  console.log(`Confluence Score: ${result2.confluenceScore} (Expected: 0.0)`)
  console.log(`Market Bias: ${result2.marketBias} (Expected: neutral)`)
  console.log(`Recommendation: ${result2.recommendation} (Expected: WAIT)`)

  if (result2.confluenceScore === 0 && result2.recommendation === 'WAIT' && result2.marketBias === 'neutral') {
    console.log('🟢 TEST CASE 2 PASSED')
  } else {
    console.error('🔴 TEST CASE 2 FAILED')
  }

  console.log('\n--- TESTS COMPLETED ---')
}

runTests()
