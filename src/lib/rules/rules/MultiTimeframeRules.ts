import { RuleInput, RuleResult } from '../types'

export function runMultiTimeframeRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []

    // Rule 1: HTF bias alignment
    const htfBias = input.htfBias ?? 'neutral'
    const htfAligned =
        (input.direction === 'buy' && htfBias === 'bullish') ||
        (input.direction === 'sell' && htfBias === 'bearish')
    const htfNeutral = htfBias === 'neutral'

    results.push({
        ruleName: 'HTF Bias Alignment',
        passed: htfAligned || htfNeutral,
        score: htfAligned ? 15 : htfNeutral ? 7 : 0,
        reason: htfAligned
            ? 'Trade direction aligned with Higher Timeframe bias — strong confluence'
            : htfNeutral
                ? 'HTF bias neutral — proceed with caution'
                : 'Trade direction CONFLICTS with HTF bias — high risk',
        warning: !htfAligned && !htfNeutral
            ? 'ICT: Never trade against the HTF bias'
            : undefined,
    })

    // Rule 2: Timeframe appropriateness
    const tf = input.timeframe ?? 'H1'
    const goodTF = ['M15', 'H1', 'H4'].includes(tf)
    results.push({
        ruleName: 'Timeframe Quality',
        passed: goodTF,
        score: goodTF ? 5 : 2,
        reason: goodTF
            ? 'Timeframe ' + tf + ' — suitable for ICT entry'
            : 'Timeframe ' + tf + ' — consider M15/H1/H4 for better precision',
    })

    return results
}