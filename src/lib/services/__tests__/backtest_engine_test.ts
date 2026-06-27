import assert from 'assert'
import { TradeJournal, BacktestConfig } from '@/types/database'
import { BacktestDataAdapter } from '../BacktestDataAdapter'
import { EquityCurveCalculator } from '../EquityCurveCalculator'
import { DrawdownAnalyzer } from '../DrawdownAnalyzer'
import { PerformanceAggregator } from '../PerformanceAggregator'
import { MonteCarloEngine } from '../MonteCarloEngine'
import { WalkForwardEngine } from '../WalkForwardEngine'
import { ExportEngine } from '../ExportEngine'
import { BacktestOrchestrator } from '../BacktestOrchestrator'

console.log('--- RUNNING BACKTESTING ENGINE TESTS ---')

// Mock trades
const mockTrades: TradeJournal[] = [
  { id: 't1', user_id: 'u1', pair: 'EURUSD', direction: 'buy', timeframe: '15m', session: 'london', killzone: 'london', setup_type: 'MSS+FVG', entry: 1.085, stop_loss: 1.083, take_profit: 1.089, risk_reward: 2.0, result: 'win', pnl: 200, notes: null, screenshot_url: null, ai_confidence: 85, prediction_id: null, created_at: '2024-01-10T09:00:00Z' },
  { id: 't2', user_id: 'u1', pair: 'EURUSD', direction: 'sell', timeframe: '15m', session: 'london', killzone: 'london', setup_type: 'MSS+FVG', entry: 1.088, stop_loss: 1.090, take_profit: 1.084, risk_reward: 2.0, result: 'loss', pnl: -100, notes: null, screenshot_url: null, ai_confidence: 70, prediction_id: null, created_at: '2024-01-11T09:30:00Z' },
  { id: 't3', user_id: 'u1', pair: 'GBPUSD', direction: 'buy', timeframe: '15m', session: 'new_york_am', killzone: 'new_york', setup_type: 'Liquidity Sweep', entry: 1.270, stop_loss: 1.268, take_profit: 1.275, risk_reward: 2.5, result: 'win', pnl: 250, notes: null, screenshot_url: null, ai_confidence: 90, prediction_id: null, created_at: '2024-01-12T14:00:00Z' },
  { id: 't4', user_id: 'u1', pair: 'EURUSD', direction: 'buy', timeframe: '15m', session: 'london', killzone: 'london', setup_type: 'MSS+FVG', entry: 1.084, stop_loss: 1.082, take_profit: 1.088, risk_reward: 2.0, result: 'win', pnl: 200, notes: null, screenshot_url: null, ai_confidence: 88, prediction_id: null, created_at: '2024-01-15T09:15:00Z' },
]

const mockConfig: BacktestConfig = {
  name: 'Test Backtest',
  description: '',
  mlMode: 'hybrid',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31',
  pairFilter: [],
  sessionFilter: [],
  initialEquity: 100000,
  minSampleSize: 1,
}

// 1. Data Adapter Test
console.log('Testing BacktestDataAdapter...')
const adapted = BacktestDataAdapter.adapt(mockTrades, [], [], mockConfig)
assert.strictEqual(adapted.length, 4)
console.log('✔ BacktestDataAdapter passed.')

// 2. Equity Curve Calculator Test
console.log('Testing EquityCurveCalculator...')
const eqCalc = EquityCurveCalculator.calculate(adapted, 100000)
assert.strictEqual(eqCalc.finalEquity, 100550) // 100000 + 200 - 100 + 250 + 200
assert.strictEqual(eqCalc.equityCurve.length, 5)
console.log('✔ EquityCurveCalculator passed.')

// 3. Drawdown Analyzer Test
console.log('Testing DrawdownAnalyzer...')
const ddAnalysis = DrawdownAnalyzer.analyze(eqCalc.drawdownCurve)
assert.ok(ddAnalysis !== null)
console.log('✔ DrawdownAnalyzer passed.')

// 4. Performance Aggregator Test
console.log('Testing PerformanceAggregator...')
const byPair = PerformanceAggregator.byPair(adapted)
assert.strictEqual(byPair.length, 2) // EURUSD, GBPUSD
const eurusd = byPair.find(p => p.pair === 'EURUSD')
assert.ok(eurusd)
assert.strictEqual(eurusd?.trades, 3)
console.log('✔ PerformanceAggregator passed.')

// 5. Monte Carlo Engine Test
console.log('Testing MonteCarloEngine...')
const mcResult = MonteCarloEngine.simulate(adapted, 100000, 50)
assert.strictEqual(mcResult.simulationsCount, 50)
assert.ok(mcResult.probabilityOfProfit > 0)
console.log('✔ MonteCarloEngine passed.')

// 6. Walk Forward Engine Test
console.log('Testing WalkForwardEngine...')
const wfResult = WalkForwardEngine.analyze(adapted, 2)
assert.ok(wfResult !== null)
console.log('✔ WalkForwardEngine passed.')

// 7. Export Engine Test
console.log('Testing ExportEngine...')
const orchestratorRes = BacktestOrchestrator.run('r1', 'u1', mockTrades, [], [], mockConfig)
const jsonOut = ExportEngine.toJSON(orchestratorRes.report)
assert.ok(jsonOut.includes('Test Backtest'))
console.log('✔ ExportEngine passed.')

console.log('--- ALL BACKTESTING ENGINE TESTS PASSED ---')
