import { StatusCheck } from '../types'

export async function checkTwelveData(apiKey: string): Promise<StatusCheck> {
    const start = Date.now()
    try {
        const res = await fetch(
            `https://api.twelvedata.com/price?symbol=EUR/USD&apikey=${apiKey}`,
            { next: { revalidate: 60 } }
        )
        const data = await res.json()
        const rt = Date.now() - start

        if (data.code) {
            return {
                name: 'TwelveData API',
                status: 'error',
                message: 'API error: ' + data.message,
                responseTime: rt,
                lastChecked: new Date().toISOString(),
            }
        }

        return {
            name: 'TwelveData API',
            status: rt < 2000 ? 'healthy' : 'warning',
            message: rt < 2000 ? 'TwelveData responding normally' : 'TwelveData slow response: ' + rt + 'ms',
            responseTime: rt,
            lastChecked: new Date().toISOString(),
            details: { price: data.price },
        }
    } catch (err) {
        return {
            name: 'TwelveData API',
            status: 'error',
            message: 'TwelveData unreachable: ' + String(err),
            responseTime: Date.now() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}

export async function checkForexFactory(): Promise<StatusCheck> {
    const start = Date.now()
    try {
        const res = await fetch(
            'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
            { next: { revalidate: 300 } }
        )
        const rt = Date.now() - start

        if (!res.ok) {
            return {
                name: 'ForexFactory News',
                status: 'warning',
                message: 'ForexFactory returned ' + res.status,
                responseTime: rt,
                lastChecked: new Date().toISOString(),
            }
        }

        const data = await res.json()
        return {
            name: 'ForexFactory News',
            status: 'healthy',
            message: 'News feed active — ' + (Array.isArray(data) ? data.length : 0) + ' events',
            responseTime: rt,
            lastChecked: new Date().toISOString(),
            details: { eventCount: Array.isArray(data) ? data.length : 0 },
        }
    } catch (err) {
        return {
            name: 'ForexFactory News',
            status: 'error',
            message: 'ForexFactory unreachable: ' + String(err),
            responseTime: Date.now() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}

export async function checkSupabase(supabaseUrl: string): Promise<StatusCheck> {
    const start = Date.now()
    try {
        const res = await fetch(supabaseUrl + '/rest/v1/', {
            headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
            next: { revalidate: 60 },
        })
        const rt = Date.now() - start
        return {
            name: 'Supabase',
            status: res.ok ? 'healthy' : 'warning',
            message: res.ok ? 'Supabase connected' : 'Supabase returned ' + res.status,
            responseTime: rt,
            lastChecked: new Date().toISOString(),
        }
    } catch (err) {
        return {
            name: 'Supabase',
            status: 'error',
            message: 'Supabase unreachable: ' + String(err),
            responseTime: Date.now() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}