import { BrokerStatus } from '../types'

export function checkBroker(): BrokerStatus {
    return {
        connection: {
            name: 'Broker',
            status: 'healthy',
            message: 'Demo broker connected',
            lastChecked: new Date().toISOString(),
        },
        type: 'demo',
        accountId: 'DEMO-001',
    }
}