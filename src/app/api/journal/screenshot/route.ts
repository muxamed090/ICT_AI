import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File
        const tradeId = formData.get('tradeId') as string

        if (!file || !tradeId) {
            return NextResponse.json({ error: 'Missing file or tradeId' }, { status: 400 })
        }

        // Upload to Supabase Storage
        const fileName = user.id + '/' + tradeId + '-' + Date.now() + '.' + file.name.split('.').pop()
        const { error: uploadError } = await supabase.storage
            .from('trade-screenshots')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('trade-screenshots')
            .getPublicUrl(fileName)

        // Update journal entry
        const { error: updateError } = await supabase
            .from('trade_journal')
            .update({ screenshot_url: publicUrl })
            .eq('id', tradeId)
            .eq('user_id', user.id)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ url: publicUrl })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}