import { DecisionInput, RiskPlan } from '../types'
import { getPip, toPips } from '../utils'

export function calculateRisk(input: DecisionInput): RiskPlan {
    const pip = getPip(input.pair)
    const riskAmount = parseFloat((input.accountBalance * (input.riskPercent / 100)).toFixed(2))

    const slPips = toPips(input.pair, Math.abs(input.entry - input.stop_loss))
    const tp1Pips = toPips(input.pair, Math.abs(input.tp1 - input.entry))
    const tp2Pips = toPips(input.pair, Math.abs(input.tp2 - input.entry))

    // Position size: risk / (slPips * pipValue)
    const pipValue = pip * 100000 // standard lot
    const positionSizeLots = slPips > 0
        ? parseFloat((riskAmount / (slPips * pipValue)).toFixed(2))
        : 0.01

    const rewardTP1 = parseFloat((positionSizeLots * tp1Pips * pipValue).toFixed(2))
    const rewardTP2 = parseFloat((positionSizeLots * tp2Pips * pipValue).toFixed(2))
    const riskRewardTP1 = slPips > 0 ? parseFloat((tp1Pips / slPips).toFixed(2)) : 0
    const riskRewardTP2 = slPips > 0 ? parseFloat((tp2Pips / slPips).toFixed(2)) : 0

    return {
        riskAmount,
        positionSizeLots,
        pipValue,
        slPips,
        tp1Pips,
        tp2Pips,
        rewardTP1,
        rewardTP2,
        riskRewardTP1,
        riskRewardTP2,
    }
}