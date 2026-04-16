import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = `Reserva de Salas AYP <${process.env.GMAIL_USER}>`

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  })
}

function generateICS(r: { reason: string; date: string; start_time: string; duration_hours: number; room_name: string; organizer_name: string; organizer_email: string }) {
  const start = new Date(`${r.date}T${r.start_time}`)
  const end = new Date(start.getTime() + r.duration_hours * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SalasAYP//ES','BEGIN:VEVENT',
    `UID:${Date.now()}@salasayp`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
    `SUMMARY:${r.reason}`,`LOCATION:${r.room_name}`,
    `ORGANIZER;CN=${r.organizer_name}:mailto:${r.organizer_email}`,
    'END:VEVENT','END:VCALENDAR'].join('\r\n')
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>
  body { margin:0; padding:0; background:#f0efeb; font-family:Arial,sans-serif; }
  table { border-spacing:0; }
  td { padding:0; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f0efeb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0efeb;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background-color:#111111;border-radius:8px 8px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:20px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:40px;height:40px;background-color:#F5C800;border-radius:20px;text-align:center;vertical-align:middle;">
                        <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#111111;">a&amp;p</span>
                      </td>
                      <td style="padding-left:12px;">
                        <span style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;">AYP</span>
                        <span style="font-family:Arial,sans-serif;font-size:16px;color:#cccccc;"> — Reserva de Salas</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="background-color:#F5C800;height:3px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border-radius:0 0 8px 8px;padding:32px 28px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#999999;margin:0;">Reserva de Salas AYP &nbsp;·&nbsp; reserva.salas.ayp@gmail.com</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#bbbbbb;margin:6px 0 0;">Desarrollado por TecnologyApp</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function detailsTable(rows: { label: string; value: string }[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f7;border-radius:8px;margin:20px 0;">
  <tr><td style="padding:20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.map(r => `<tr>
        <td style="font-family:Arial,sans-serif;font-size:13px;color:#888888;padding:5px 0;width:130px;vertical-align:top;">${r.label}</td>
        <td style="font-family:Arial,sans-serif;font-size:13px;color:#111111;font-weight:bold;padding:5px 0;vertical-align:top;">${r.value}</td>
      </tr>`).join('')}
    </table>
  </td></tr>
</table>`
}

export async function sendConfirmationEmail(reservation: {
  id: string; cancel_token: string; organizer_name: string; organizer_email: string
  room_name: string; date: string; start_time: string; duration_hours: number
  reason: string; attendees_count: number; guest_emails: string[]
}) {
  const cancelUrl = `${APP_URL}/cancelar/${reservation.cancel_token}`
  const icsContent = generateICS({ ...reservation })
  const transporter = getTransporter()
  const rows = [
    { label: 'Sala', value: reservation.room_name },
    { label: 'Fecha', value: formatDate(reservation.date) },
    { label: 'Hora', value: `${reservation.start_time.slice(0,5)} (${reservation.duration_hours}h)` },
    { label: 'Motivo', value: reservation.reason },
    { label: 'Asistentes', value: `${reservation.attendees_count} personas` },
  ]
  const content = `
<h2 style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#111111;margin:0 0 8px;">Reserva confirmada ✓</h2>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 4px;">Hola <strong>${reservation.organizer_name}</strong>,</p>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 20px;">Tu reserva fue aprobada. Aquí están los detalles:</p>
${detailsTable(rows)}
<p style="font-family:Arial,sans-serif;font-size:13px;color:#555555;margin:20px 0 8px;">¿Necesitas cancelar?</p>
<table role="presentation" cellpadding="0" cellspacing="0">
  <tr><td style="border-radius:6px;background-color:#ffffff;border:1px solid #dddddd;">
    <a href="${cancelUrl}" target="_blank" style="display:inline-block;padding:11px 24px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#111111;text-decoration:none;">Cancelar reserva</a>
  </td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#999999;margin:20px 0 0;">El archivo <strong>reserva.ics</strong> adjunto te permite agregar esta reunión a tu calendario.</p>`

  await transporter.sendMail({
    from: FROM_EMAIL, to: reservation.organizer_email,
    subject: `✓ Reserva confirmada — ${reservation.room_name} · ${reservation.date}`,
    html: emailWrapper(content),
    attachments: [{ filename: 'reserva.ics', content: icsContent }],
  })

  for (const email of reservation.guest_emails) {
    const guestContent = `
<h2 style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#111111;margin:0 0 8px;">Tienes una reunión agendada</h2>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 20px;">Has sido invitado/a por <strong>${reservation.organizer_name}</strong>:</p>
${detailsTable(rows)}
<p style="font-family:Arial,sans-serif;font-size:12px;color:#999999;margin:20px 0 0;">Adjuntamos <strong>invitacion.ics</strong> para agregar esta reunión a tu calendario con un clic.</p>`
    await transporter.sendMail({
      from: FROM_EMAIL, to: email,
      subject: `Invitación: ${reservation.reason} — ${formatDate(reservation.date)}`,
      html: emailWrapper(guestContent),
      attachments: [{ filename: 'invitacion.ics', content: icsContent }],
    })
  }
}

export async function sendReminderEmail(reservation: {
  organizer_name: string; organizer_email: string; room_name: string
  date: string; start_time: string; duration_hours: number; reason: string; guest_emails: string[]
}) {
  const transporter = getTransporter()
  const rows = [
    { label: 'Sala', value: reservation.room_name },
    { label: 'Hora de inicio', value: reservation.start_time.slice(0,5) },
    { label: 'Duración', value: `${reservation.duration_hours}h` },
    { label: 'Motivo', value: reservation.reason },
  ]
  const content = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr><td style="background-color:#FAEEDA;border-radius:6px;padding:12px 16px;">
    <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#854F0B;margin:0;">⏰ Tu reunión comienza en 30 minutos</p>
  </td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 20px;">Hola <strong>${reservation.organizer_name}</strong>, este es un recordatorio:</p>
${detailsTable(rows)}
<p style="font-family:Arial,sans-serif;font-size:12px;color:#999999;margin:20px 0 0;">Por favor prepara la sala con anticipación.</p>`

  const allEmails = [reservation.organizer_email, ...reservation.guest_emails]
  for (const email of allEmails) {
    await transporter.sendMail({
      from: FROM_EMAIL, to: email,
      subject: `⏰ Recordatorio: ${reservation.reason} comienza en 30 min — ${reservation.room_name}`,
      html: emailWrapper(content),
    })
  }
}

export async function sendCancellationEmail(organizer_name: string, organizer_email: string, room_name: string, date: string) {
  const transporter = getTransporter()
  const content = `
<h2 style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#111111;margin:0 0 16px;">Reserva cancelada</h2>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 12px;">Hola <strong>${organizer_name}</strong>,</p>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 20px;">Tu reserva en <strong>${room_name}</strong> del día <strong>${formatDate(date)}</strong> fue cancelada exitosamente.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="background-color:#EAF3DE;border-radius:6px;padding:12px 16px;">
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#3B6D11;margin:0;">✓ La sala quedó disponible inmediatamente.</p>
  </td></tr>
</table>`
  await transporter.sendMail({
    from: FROM_EMAIL, to: organizer_email,
    subject: `Reserva cancelada — ${room_name} · ${date}`,
    html: emailWrapper(content),
  })
}