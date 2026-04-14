import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/emails'

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'approved' })
      .eq('id', id)
      .select('*, rooms(name)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await sendConfirmationEmail({
      id: data.id,
      cancel_token: data.cancel_token,
      organizer_name: data.organizer_name,
      organizer_email: data.organizer_email,
      room_name: data.rooms?.name || '',
      date: data.date,
      start_time: data.start_time,
      duration_hours: data.duration_hours,
      reason: data.reason,
      attendees_count: data.attendees_count,
      guest_emails: data.guest_emails || [],
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
