import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCancellationEmail } from '@/lib/emails'

export async function POST(req: NextRequest) {
  try {
    const { cancel_token } = await req.json()
    const { data: res, error: fetchErr } = await supabaseAdmin
      .from('reservations')
      .select('*, rooms(name)')
      .eq('cancel_token', cancel_token)
      .single()

    if (fetchErr || !res) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    if (res.status === 'cancelled') return NextResponse.json({ error: 'Ya fue cancelada' }, { status: 400 })

    await supabaseAdmin.from('reservations').update({ status: 'cancelled' }).eq('cancel_token', cancel_token)

    await sendCancellationEmail(res.organizer_name, res.organizer_email, res.rooms?.name || '', res.date)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
