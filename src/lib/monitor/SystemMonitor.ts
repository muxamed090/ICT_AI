import { SystemHealth, StatusLevel } from './types'
import { checkICTEngine, checkMLEngine, checkRulesEngine, checkDecisionEngine } from './checks/EngineCheck'
import { checkTwelveData, checkForexFactory, checkSupabase } from './checks/APICheck'
import { checkBroker } from './checks/BrokerCheck'
import { checkPerformance } from './checks/PerformanceCheck'

export async function runSystemCheck(apiKey: string, supabaseUrl: string): Promise<SystemHealth> {
    const [
        ict, ml, rules, decision,
        twelveData, forexFactory, supabase,
    ] = await Promise.all([
        Promise.resolve(checkICTEngine()),
        Promise.resolve(checkMLEngine()),
        Promise.resolve(checkRulesEngine()),
        Promise.resolve(checkDecisionEngine()),
        checkTwelveData(apiKey),
        checkForexFactory(),
        checkSupabase(supabaseUrl),
    ])

    const broker = checkBroker()

    const responseTimes = [
        ict.responseTime ?? 0,
        ml.responseTime ?? 0,
        rules.responseTime ?? 0,
        decision.responseTime ?? 0,
        twelveData.responseTime ?? 0,
        forexFactory.responseTime ?? 0,
    ]

    const performance = checkPerformance(responseTimes, 0, 100, Date.now())

    const allChecks = [ict, ml, rules, decision, twelveData, forexFactory, supabase]
    const hasError = allChecks.some((c) => c.status === 'error')
    const hasWarning = allChecks.some((c) => c.status === 'warning')
    const overall: StatusLevel = hasError ? 'error' : hasWarning ? 'warning' : 'healthy'

    return {
        overall,
        engines: { ictEngine: ict, mlEngine: ml, rulesEngine: rules, decisionEngine: decision },
        apis: { twelveData, forexFactory, supabase },
        broker,
        performance,
        checkedAt: new Date().toISOString(),
    }
}