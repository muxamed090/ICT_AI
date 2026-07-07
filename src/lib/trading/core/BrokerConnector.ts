import { BrokerConfig } from '../types'

// MT4/MT5 Bridge — mustaqbalka real broker connection
// Hadda: demo mode simulation
export class BrokerConnector {
    private config: BrokerConfig

    constructor(config?: Partial<BrokerConfig>) {
        this.config = {
            type: config?.type ?? 'demo',
            serverUrl: config?.serverUrl,
            accountId: config?.accountId,
            apiKey: config?.apiKey,
            connected: false,
        }
    }

    async connect(): Promise<{ success: boolean; message: string }> {
        // Demo mode — always connected
        if (this.config.type === 'demo') {
            this.config.connected = true
            return { success: true, message: 'Demo broker connected' }
        }

        // MT4/MT5 — requires bridge server
        if (!this.config.serverUrl) {
            return { success: false, message: 'MT4/MT5 bridge URL not configured' }
        }

        try {
            const res = await fetch(this.config.serverUrl + '/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: this.config.accountId,
                    apiKey: this.config.apiKey,
                }),
            })
            if (res.ok) {
                this.config.connected = true
                return { success: true, message: 'MT4/MT5 connected successfully' }
            }
            return { success: false, message: 'Connection failed: ' + res.status }
        } catch (err) {
            return { success: false, message: 'Connection error: ' + String(err) }
        }
    }

    isConnected(): boolean { return this.config.connected }
    getType(): string { return this.config.type }

    async getAccountInfo(): Promise<{ balance: number; equity: number; margin: number }> {
        // Demo values
        return { balance: 10000, equity: 10000, margin: 0 }
    }
}