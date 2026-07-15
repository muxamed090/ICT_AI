import { StatusCheck } from '../types'

export async function checkTwelveData(apiKey: string): Promise<StatusCheck> {
    const start = Date.now()
    try {
        const res = await fetch(
            'https://api.twelvedata.com/price?symbol=EUR/USD&apikey=' + apiKey,
            { next: { revalidate: 60 } }
        )
        const data = await res.json()
        const rt = Date.now() - start
        if (data.code) {
            return { name: 'TwelveData API', status: 'error', message: 'API error: ' + data.message, responseTime: rt, lastChecked: new Date().toISOString() }
        }
        return { name: 'TwelveData API', status: rt < 2000 ? 'healthy' : 'warning', message: rt < 2000 ? 'TwelveData responding normally' : 'Slow: ' + rt + 'ms', responseTime: rt, lastChecked: new Date().toISOString() }
    } catch (err) {
        return { name: 'TwelveData API', status: 'error', message: 'Unreachable: ' + String(err), responseTime: Date.now() - start, lastChecked: new Date().toISOString() }
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
            return { name: 'ForexFactory News', status: 'warning', message: 'Returned ' + res.status, responseTime: rt, lastChecked: new Date().toISOString() }
        }
        const data = await res.json()
        return { name: 'ForexFactory News', status: 'healthy', message: 'News feed active — ' + (Array.isArray(data) ? data.length : 0) + ' events', responseTime: rt, lastChecked: new Date().toISOString() }
    } catch (err) {
        return { name: 'ForexFactory News', status: 'error', message: 'Unreachable: ' + String(err), responseTime: Date.now() - start, lastChecked: new Date().toISOString() }
    }
}

export async function checkSupabase(supabaseUrl: string): Promise<StatusCheck> {
    const start = Date.now()
    try {
        if (!supabaseUrl) {
            return { name: 'Supabase', status: 'warning', message: 'URL not configured', responseTime: 0, lastChecked: new Date().toISOString() }
        }
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
        const res = await fetch(supabaseUrl + '/rest/v1/user_settings?select=id&limit=1', {
            headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey },
            next: { revalidate: 60 },
        })
        const rt = Date.now() - start
        const ok = res.status === 200 || res.status === 406
        return { name: 'Supabase', status: ok ? 'healthy' : 'warning', message: ok ? 'Supabase connected' : 'Returned ' + res.status, responseTime: rt, lastChecked: new Date().toISOString() }
    } catch (err) {
        return { name: 'Supabase', status: 'error', message: 'Unreachable: ' + String(err), responseTime: Date.now() - start, lastChecked: new Date().toISOString() }
    }
}