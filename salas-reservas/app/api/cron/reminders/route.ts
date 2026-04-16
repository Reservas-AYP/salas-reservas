import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendReminderEmail } from '@/lib/emails'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const now = new Date()
  const from = new Date(now.getTime() + 28 * 60 * 1000)
  const to = new Date(now.getTime() + 32 * 60 * 1000)

  const fromTime = from.toTimeString().slice(0, 5)
  const toTime = to.toTimeString().slice(0, 5)
  const fromDate = from.toISOString().slice(0, 10)

  const { data: reservations, error } = await admin
    .from('reservations')
    .select('*, rooms(name)')
    .eq('status', 'approved')
    .eq('date', fromDate)
    .gte('start_time', fromTime)
    .lte('start_time', toTime)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay reuniones próximas' })
  }

  let sent = 0
  for (const res of reservations) {
    try {
      await sendReminderEmail({
        organizer_name: res.organizer_name,
        organizer_email: res.organizer_email,
        room_name: (res as any).rooms?.name || '',
        date: res.date,
        start_time: res.start_time,
        duration_hours: res.duration_hours,
        reason: res.reason,
        guest_emails: res.guest_emails || [],
      })
      sent++
    } catch (e) {
      console.error('Error sending reminder:', e)
    }
  }

  return NextResponse.json({ sent, message: `${sent} recordatorio(s) enviado(s)` })
}