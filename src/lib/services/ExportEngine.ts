import { BacktestReport, BacktestTrade } from '@/types/database'

export class ExportEngine {
  /**
   * Generates a structured JSON string representation of a backtest report.
   */
  static toJSON(report: BacktestReport): string {
    return JSON.stringify(report, null, 2)
  }

  /**
   * Generates a CSV string representation of individual trades for Excel / Power BI analysis.
   */
  static tradesToCSV(trades: BacktestTrade[]): string {
    const headers = [
      'Trade Index',
      'Traded At',
      'Pair',
      'Direction',
      'Timeframe',
      'Session',
      'Killzone',
      'Setup Type',
      'Entry Price',
      'Stop Loss',
      'Take Profit',
      'Risk Reward',
      'Result',
      'PnL',
      'ICT Score',
      'ML Score',
      'Final Score',
      'AI Decision',
      'Running Equity',
      'Running Drawdown Pct',
    ]

    const rows = trades.map((t) => [
      t.trade_index,
      `"${t.traded_at}"`,
      `"${t.pair}"`,
      `"${t.direction}"`,
      `"${t.timeframe}"`,
      `"${t.session}"`,
      `"${t.killzone}"`,
      `"${t.setup_type}"`,
      t.entry_price,
      t.stop_loss,
      t.take_profit,
      t.risk_reward,
      `"${t.result}"`,
      t.pnl,
      t.ict_score ?? '',
      t.ml_score ?? '',
      t.final_score ?? '',
      `"${t.ai_decision ?? ''}"`,
      t.running_equity,
      t.running_drawdown,
    ])

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  }

  /**
   * Generates a formatted text/HTML summary suitable for PDF printing / export.
   */
  static toPDFText(report: BacktestReport): string {
    return `
================================================================================
                       ICT AI TRADER v2.0 - BACKTEST REPORT
================================================================================
Run Name:           ${report.config.name}
Run ID:             ${report.runId}
Generated At:       ${report.generatedAt}
Engine Versions:    Rules: ${report.engineVersions.rulesEngine} | Decision: ${report.engineVersions.decisionEngine} | ML: ${report.engineVersions.mlEngine}
Strategy Mode:      ${report.config.mlMode.toUpperCase()}
Sample Date Range:  ${report.config.dateFrom} to ${report.config.dateTo}

--------------------------------------------------------------------------------
1. HEADLINE SUMMARY METRICS
--------------------------------------------------------------------------------
Total Trades:       ${report.totalTrades} (Wins: ${report.winningTrades} | Losses: ${report.losingTrades} | BE: ${report.breakevenTrades})
Win Rate:           ${report.winRate.toFixed(2)}%
Profit Factor:      ${report.profitFactor.toFixed(2)}
Expectancy:         $${report.expectancy.toFixed(2)} per trade
Average R:R:        1:${report.avgRR.toFixed(2)}
Net PnL:            $${report.netPnl.toFixed(2)} (Gross Profit: $${report.grossProfit.toFixed(2)} | Gross Loss: $${report.grossLoss.toFixed(2)})
Max Drawdown:       $${report.maxDrawdown.toFixed(2)} (${report.maxDrawdownPct.toFixed(2)}%)
Sharpe Ratio:       ${report.sharpeRatio !== null ? report.sharpeRatio.toFixed(2) : 'N/A'}

--------------------------------------------------------------------------------
2. MONTE CARLO RISK ANALYSIS
--------------------------------------------------------------------------------
Simulations Count:  ${report.monteCarlo ? report.monteCarlo.simulationsCount : 'N/A'}
Worst Drawdown:     ${report.monteCarlo ? report.monteCarlo.worstDrawdownPct.toFixed(2) + '%' : 'N/A'}
Probability Profit: ${report.monteCarlo ? report.monteCarlo.probabilityOfProfit.toFixed(2) + '%' : 'N/A'}
Median Return:      ${report.monteCarlo ? '$' + report.monteCarlo.medianReturn.toFixed(2) : 'N/A'}

--------------------------------------------------------------------------------
3. WALK-FORWARD VALIDATION
--------------------------------------------------------------------------------
Total Windows:      ${report.walkForward ? report.walkForward.totalWindows : 'N/A'}
Avg Efficiency:     ${report.walkForward ? report.walkForward.avgEfficiencyRatio.toFixed(2) : 'N/A'}
Robustness Score:   ${report.walkForward ? report.walkForward.robustnessScore.toFixed(1) + '/100' : 'N/A'}

================================================================================
`
  }
}
