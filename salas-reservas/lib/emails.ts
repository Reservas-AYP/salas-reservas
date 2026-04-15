import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = `Reserva de Salas AYP <${process.env.GMAIL_USER}>`

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  })
}

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
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SalasReservas//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@salasreservas`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
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
  const icsContent = generateICS({ ...reservation })
  const transporter = getTransporter()

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: reservation.organizer_email,
    subject: `✓ Reserva confirmada — ${reservation.room_name} · ${reservation.date}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#111;padding:20px 24px;border-radius:8px 8px 0 0;">
        <span style="color:#F5C800;font-weight:700;font-size:16px;">AYP</span>
        <span style="color:#fff;font-size:16px;"> — Reserva de Salas</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
        <h2 style="font-size:18px;font-weight:600;margin:0 0 8px;">Reserva confirmada ✓</h2>
        <p style="color:#666;font-size:14px;margin:0 0 20px;">Hola <strong>${reservation.organizer_name}</strong>, tu reserva fue aprobada.</p>
        <div style="background:#f9f9f7;border-radius:8px;padding:16px;margin-bottom:20px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#666;padding:5px 0;width:120px">Sala</td><td style="font-weight:500">${reservation.room_name}</td></tr>
            <tr><td style="color:#666;padding:5px 0">Fecha</td><td style="font-weight:500">${reservation.date}</td></tr>
            <tr><td style="color:#666;padding:5px 0">Hora</td><td style="font-weight:500">${reservation.start_time} (${reservation.duration_hours}h)</td></tr>
            <tr><td style="color:#666;padding:5px 0">Motivo</td><td style="font-weight:500">${reservation.reason}</td></tr>
            <tr><td style="color:#666;padding:5px 0">Asistentes</td><td style="font-weight:500">${reservation.attendees_count} personas</td></tr>
          </table>
        </div>
        <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">Cancelar reserva</a>
        <p style="font-size:12px;color:#999;margin-top:16px;">El archivo adjunto te permite agregar esta reunión a tu calendario.</p>
      </div>
    </div>`,
    attachments: [{ filename: 'reserva.ics', content: icsContent }],
  })

  for (const email of reservation.guest_emails) {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `Invitación: ${reservation.reason} — ${reservation.date}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#111;padding:20px 24px;border-radius:8px 8px 0 0;">
          <span style="color:#F5C800;font-weight:700;font-size:16px;">AYP</span>
          <span style="color:#fff;font-size:16px;"> — Invitación a reunión</span>
        </div>
        <div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
          <p>Has sido invitado/a por <strong>${reservation.organizer_name}</strong>.</p>
          <div style="background:#f9f9f7;border-radius:8px;padding:16px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:120px">Sala</td><td style="font-weight:500">${reservation.room_name}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Fecha</td><td style="font-weight:500">${reservation.date}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Hora</td><td style="font-weight:500">${reservation.start_time} (${reservation.duration_hours}h)</td></tr>
              <tr><td style="color:#666;padding:5px 0">Motivo</td><td style="font-weight:500">${reservation.reason}</td></tr>
            </table>
          </div>
          <p style="font-size:13px;color:#666;margin-top:16px;">El archivo adjunto te permite agregar esta reunión a tu calendario.</p>
        </div>
      </div>`,
      attachments: [{ filename: 'invitacion.ics', content: icsContent }],
    })
  }
}

export async function sendCancellationEmail(
  organizer_name: string,
  organizer_email: string,
  room_name: string,
  date: string
) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: organizer_email,
    subject: `Reserva cancelada — ${room_name} · ${date}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#111;padding:20px 24px;border-radius:8px 8px 0 0;">
        <span style="color:#F5C800;font-weight:700;">AYP</span>
        <span style="color:#fff;"> — Reserva de Salas</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
        <h2 style="font-size:18px;font-weight:600;">Reserva cancelada</h2>
        <p>Hola <strong>${organizer_name}</strong>, tu reserva en <strong>${room_name}</strong> del día <strong>${date}</strong> fue cancelada.</p>
        <p style="color:#666;font-size:14px;">La sala quedó disponible inmediatamente para otras personas.</p>
      </div>
    </div>`,
  })
}