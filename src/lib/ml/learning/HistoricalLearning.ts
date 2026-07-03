import { TradeRecord } from '../types'

// Seed data — mustaqbalka Journal-ka ayaa cusboonaysiin doona
export function getSeedTrades(): TradeRecord[] {
    return [
        {
            id: 'seed-1', pair: 'EURUSD', direction: 'buy',
            session: 'london', setup: 'BOS+FVG', entry: 1.08, stop_loss: 1.078,
            tp1: 1.083, tp2: 1.086, outcome: 'win', rr_achieved: 1.5,
            holding_hours: 3, ict_score: 82, confidence: 78,
            created_at: '2026-01-10T09:00:00Z',
        },
        {
            id: 'seed-2', pair: 'EURUSD', direction: 'buy',
            session: 'london', setup: 'BOS+FVG', entry: 1.085, stop_loss: 1.083,
            tp1: 1.088, tp2: 1.091, outcome: 'win', rr_achieved: 2.1,
            holding_hours: 4, ict_score: 88, confidence: 84,
            created_at: '2026-01-15T08:30:00Z',
        },
        {
            id: 'seed-3', pair: 'EURUSD', direction: 'sell',
            session: 'new_york', setup: 'CHoCH+OB', entry: 1.09, stop_loss: 1.092,
            tp1: 1.087, tp2: 1.084, outcome: 'loss', rr_achieved: -1,
            holding_hours: 2, ict_score: 65, confidence: 60,
            created_at: '2026-01-20T14:00:00Z',
        },
        {
            id: 'seed-4', pair: 'XAUUSD', direction: 'buy',
            session: 'london', setup: 'BOS+FVG', entry: 2020, stop_loss: 2016,
            tp1: 2026, tp2: 2032, outcome: 'win', rr_achieved: 2.5,
            holding_hours: 5, ict_score: 91, confidence: 88,
            created_at: '2026-02-01T09:00:00Z',
        },
        {
            id: 'seed-5', pair: 'XAUUSD', direction: 'sell',
            session: 'new_york', setup: 'Liquidity+OB', entry: 2050, stop_loss: 2054,
            tp1: 2044, tp2: 2038, outcome: 'win', rr_achieved: 1.8,
            holding_hours: 3, ict_score: 79, confidence: 75,
            created_at: '2026-02-10T13:00:00Z',
        },
        {
            id: 'seed-6', pair: 'EURJPY', direction: 'buy',
            session: 'overlap', setup: 'BOS+FVG', entry: 162, stop_loss: 161.6,
            tp1: 162.6, tp2: 163.2, outcome: 'win', rr_achieved: 1.5,
            holding_hours: 2, ict_score: 75, confidence: 72,
            created_at: '2026-02-15T08:00:00Z',
        },
        {
            id: 'seed-7', pair: 'USDCAD', direction: 'sell',
            session: 'new_york', setup: 'CHoCH+FVG', entry: 1.36, stop_loss: 1.362,
            tp1: 1.357, tp2: 1.354, outcome: 'loss', rr_achieved: -1,
            holding_hours: 6, ict_score: 62, confidence: 58,
            created_at: '2026-02-20T15:00:00Z',
        },
        {
            id: 'seed-8', pair: 'EURUSD', direction: 'buy',
            session: 'london', setup: 'BOS+FVG', entry: 1.082, stop_loss: 1.080,
            tp1: 1.085, tp2: 1.088, outcome: 'win', rr_achieved: 1.8,
            holding_hours: 3, ict_score: 85, confidence: 81,
            created_at: '2026-03-01T09:00:00Z',
        },
    ]
}