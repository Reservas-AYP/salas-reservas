import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = 'reservas@tuempresa.com'

function generateICS(reservation: {
  reason: string
  date: string
  start_time: string
  duration_hours: number
  room_name: string
  organizer_name: string
  organizer_email: string
}) {
  const start = new Date(`${reservation.date}T${reservation.start_time}`)
  const end = new Date(start.getTime() + reservation.duration_hours * 60 * 60 * 1000)
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SalasReservas//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@salasreservas`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:${reservation.reason}`,
    `LOCATION:${reservation.room_name}`,
    `ORGANIZER;CN=${reservation.organizer_name}:mailto:${reservation.organizer_email}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function sendConfirmationEmail(reservation: {
  id: string
  cancel_token: string
  organizer_name: string
  organizer_email: string
  room_name: string
  date: string
  start_time: string
  duration_hours: number
  reason: string
  attendees_count: number
  guest_emails: string[]
}) {
  const cancelUrl = `${APP_URL}/cancelar/${reservation.cancel_token}`
  const modifyUrl = `${APP_URL}/modificar/${reservation.cancel_token}`
  const icsContent = generateICS({ ...reservation, organizer_name: reservation.organizer_name, organizer_email: reservation.organizer_email })

  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:24px">
      <h1 style="font-size:20px;font-weight:600;margin:0">Reserva confirmada</h1>
    </div>
    <p>Hola <strong>${reservation.organizer_name}</strong>, tu reserva ha sido aprobada.</p>
    <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0">
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="color:#666;padding:6px 0;width:140px">Sala</td><td style="font-weight:500">${reservation.room_name}</td></tr>
        <tr><td style="color:#666;padding:6px 0">Fecha</td><td style="font-weight:500">${new Date(reservation.date + 'T12:00:00').toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        <tr><td style="color:#666;padding:6px 0">Hora</td><td style="font-weight:500">${reservation.start_time} (${reservation.duration_hours}h)</td></tr>
        <tr><td style="color:#666;padding:6px 0">Motivo</td><td style="font-weight:500">${reservation.reason}</td></tr>
        <tr><td style="color:#666;padding:6px 0">Asistentes</td><td style="font-weight:500">${reservation.attendees_count} personas</td></tr>
      </table>
    </div>
    <div style="display:flex;gap:12px;margin:24px 0">
      <a href="${modifyUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">Modificar reserva</a>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#fff;color:#111;text-decoration:none;border-radius:6px;font-size:14px;border:1px solid #ddd">Cancelar</a>
    </div>
    <p style="font-size:12px;color:#999;margin-top:32px">Si cancelas, la sala quedará disponible inmediatamente para otros.</p>
  </div>`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: reservation.organizer_email,
    subject: `✓ Reserva confirmada — ${reservation.room_name} · ${reservation.date}`,
    html,
    attachments: [{ filename: 'reserva.ics', content: Buffer.from(icsContent).toString('base64') }],
  })

  if (reservation.guest_emails.length > 0) {
    const guestHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:20px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:16px">Invitación a reunión</h1>
      <p>Has sido invitado/a a una reunión organizada por <strong>${reservation.organizer_name}</strong>.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="color:#666;padding:6px 0;width:140px">Sala</td><td style="font-weight:500">${reservation.room_name}</td></tr>
          <tr><td style="color:#666;padding:6px 0">Fecha</td><td style="font-weight:500">${new Date(reservation.date + 'T12:00:00').toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td style="color:#666;padding:6px 0">Hora</td><td style="font-weight:500">${reservation.start_time} (${reservation.duration_hours}h)</td></tr>
          <tr><td style="color:#666;padding:6px 0">Motivo</td><td style="font-weight:500">${reservation.reason}</td></tr>
        </table>
      </div>
      <p style="font-size:14px">El archivo adjunto <strong>invitacion.ics</strong> te permite agregar esta reunión directamente a tu calendario (Google Calendar, Outlook, Apple Calendar).</p>
    </div>`

    for (const email of reservation.guest_emails) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Invitación: ${reservation.reason} — ${reservation.date}`,
        html: guestHtml,
        attachments: [{ filename: 'invitacion.ics', content: Buffer.from(icsContent).toString('base64') }],
      })
    }
  }
}

export async function sendCancellationEmail(organizer_name: string, organizer_email: string, room_name: string, date: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: organizer_email,
    subject: `Reserva cancelada — ${room_name} · ${date}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:20px;font-weight:600">Reserva cancelada</h1>
      <p>Hola <strong>${organizer_name}</strong>, tu reserva en <strong>${room_name}</strong> del día <strong>${date}</strong> ha sido cancelada exitosamente.</p>
      <p style="color:#666;font-size:14px">La sala quedó disponible inmediatamente para otras personas.</p>
    </div>`,
  })
}
