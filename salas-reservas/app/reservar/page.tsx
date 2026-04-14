'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Room, ConfigOption } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

function ReservarContent() {
  const params = useSearchParams()
  const preselectedRoom = params.get('sala')

  const [step, setStep] = useState(preselectedRoom ? 2 : 1)
  const [rooms, setRooms] = useState<Room[]>([])
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    start_time: '',
    duration_hours: 1,
    reason: '',
    attendees_count: '',
    needs_coffee: false,
    coffee_time: '',
    config_options: [] as string[],
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    guest_emails: '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: rms }, { data: opts }] = await Promise.all([
        supabase.from('rooms').select('*').eq('is_active', true).order('created_at'),
        supabase.from('room_config_options').select('*').eq('is_active', true),
      ])
      const roomList = rms || []
      setRooms(roomList)
      setConfigOptions(opts || [])
      if (preselectedRoom) {
        const r = roomList.find((x: Room) => x.id === preselectedRoom)
        if (r) setSelectedRoom(r)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedRoom || !form.date) return
    async function checkSlots() {
      const { data } = await supabase.from('reservations')
        .select('start_time,duration_hours')
        .eq('room_id', selectedRoom!.id)
        .eq('date', form.date)
        .neq('status', 'cancelled')
      const busy: string[] = []
      for (const res of (data || [])) {
        const startIdx = HOURS.indexOf(res.start_time.slice(0,5))
        for (let i = 0; i < res.duration_hours; i++) {
          if (HOURS[startIdx + i]) busy.push(HOURS[startIdx + i])
        }
      }
      setBusySlots(busy)
    }
    checkSlots()
  }, [selectedRoom, form.date])

  function toggleConfig(label: string) {
    setForm(f => ({
      ...f,
      config_options: f.config_options.includes(label)
        ? f.config_options.filter(x => x !== label)
        : [...f.config_options, label]
    }))
  }

  async function submit() {
    setSubmitting(true)
    const guestList = form.guest_emails.split(',').map(e => e.trim()).filter(Boolean)
    const body = {
      room_id: selectedRoom!.id,
      organizer_name: form.organizer_name,
      organizer_email: form.organizer_email,
      organizer_phone: form.organizer_phone,
      date: form.date,
      start_time: form.start_time,
      duration_hours: form.duration_hours,
      reason: form.reason,
      attendees_count: Number(form.attendees_count),
      needs_coffee: form.needs_coffee,
      coffee_time: form.needs_coffee ? form.coffee_time : null,
      config_options: form.config_options,
      guest_emails: guestList,
      status: 'pending',
    }
    await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setDone(true)
    setSubmitting(false)
  }

  function stepDot(n: number, lbl: string) {
    const state = n < step ? 'done' : n === step ? 'current' : 'upcoming'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, background: state === 'done' ? '#EAF3DE' : state === 'current' ? '#F5C800' : 'transparent', color: state === 'done' ? '#3B6D11' : state === 'current' ? '#111' : '#999', border: state === 'upcoming' ? '0.5px solid #ccc' : 'none' }}>
          {state === 'done' ? '✓' : n}
        </div>
        <span style={{ fontSize: 12, color: state === 'current' ? '#111' : '#999', fontWeight: state === 'current' ? 500 : 400 }}>{lbl}</span>
      </div>
    )
  }

  const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 13, color: '#111', background: '#fff', outline: 'none' }} />
  )

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#f0efeb', display: 'flex', flexDirection: 'column' }}>
      <Header active="reservar" />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px', textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Solicitud enviada</h1>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Tu solicitud está en revisión. Recibirás un correo a <strong>{form.organizer_email}</strong> cuando sea aprobada.
        </p>
        <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: '#F5C800', color: '#111', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Volver al inicio</Link>
      </main>
      <Footer />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0efeb', display: 'flex', flexDirection: 'column' }}>
      <Header active="reservar" />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {stepDot(1, 'Sala')}
          <div style={{ flex: 1, height: '0.5px', background: '#ccc', minWidth: 20 }} />
          {stepDot(2, 'Fecha y hora')}
          <div style={{ flex: 1, height: '0.5px', background: '#ccc', minWidth: 20 }} />
          {stepDot(3, 'Detalles')}
          <div style={{ flex: 1, height: '0.5px', background: '#ccc', minWidth: 20 }} />
          {stepDot(4, 'Contacto')}
        </div>

        {step === 1 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Selecciona una sala</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {rooms.map(room => (
                <div key={room.id} style={{ background: '#fff', border: `${selectedRoom?.id === room.id ? '2px solid #F5C800' : '0.5px solid rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '1.25rem', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{room.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>Capacidad: {room.capacity} personas</div>
                  <button onClick={() => { setSelectedRoom(room); setStep(2) }} style={{ width: '100%', padding: '8px', border: '0.5px solid #111', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Seleccionar →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Fecha y hora — {selectedRoom?.name}</h2>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Fecha</label>
                  {inp({ type: 'date', value: form.date, min: format(addDays(new Date(), 1), 'yyyy-MM-dd'), onChange: e => setForm(f => ({ ...f, date: e.target.value, start_time: '' })) })}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Duración</label>
                  <select value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: Number(e.target.value), start_time: '' }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 13, background: '#fff' }}>
                    {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hora{h > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 8 }}>Horarios disponibles — selecciona hora de inicio</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(70px,1fr))', gap: 6 }}>
                {HOURS.map(h => {
                  const avail = !busySlots.includes(h)
                  const sel = form.start_time === h
                  return (
                    <div key={h} onClick={() => avail && setForm(f => ({ ...f, start_time: h }))} style={{ padding: '8px 4px', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: avail ? 'pointer' : 'not-allowed', background: sel ? '#F5C800' : avail ? '#EAF3DE' : '#FCEBEB', color: sel ? '#111' : avail ? '#3B6D11' : '#A32D2D' }}>
                      {h}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button onClick={() => setStep(1)} style={{ padding: '9px 20px', border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                <button disabled={!form.start_time} onClick={() => setStep(3)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: form.start_time ? '#F5C800' : '#eee', color: form.start_time ? '#111' : '#999', fontSize: 13, fontWeight: 600, cursor: form.start_time ? 'pointer' : 'not-allowed' }}>
                  Continuar →
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Detalles de la reunión</h2>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Motivo de la reunión *</label>
                  {inp({ type: 'text', placeholder: 'Ej: Revisión trimestral Q2', value: form.reason, onChange: e => setForm(f => ({ ...f, reason: e.target.value })) })}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Cantidad de personas *</label>
                  {inp({ type: 'number', min: 1, placeholder: `Máx. ${selectedRoom?.capacity}`, value: form.attendees_count, onChange: e => setForm(f => ({ ...f, attendees_count: e.target.value })) })}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>¿Servicio de café?</label>
                  <select value={form.needs_coffee ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, needs_coffee: e.target.value === 'yes' }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 13, background: '#fff' }}>
                    <option value="no">No, gracias</option>
                    <option value="yes">Sí, lo necesito</option>
                  </select>
                </div>
                {form.needs_coffee && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Hora del café</label>
                    {inp({ type: 'time', value: form.coffee_time, onChange: e => setForm(f => ({ ...f, coffee_time: e.target.value })) })}
                  </div>
                )}
                {configOptions.length > 0 && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 8 }}>Configuración de sala</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {configOptions.map(opt => {
                        const selected = form.config_options.includes(opt.label)
                        return (
                          <div key={opt.id} onClick={() => toggleConfig(opt.label)} style={{ padding: '6px 14px', borderRadius: 20, border: `0.5px solid ${selected ? '#F5C800' : 'rgba(0,0,0,0.2)'}`, background: selected ? '#F5C800' : 'transparent', color: '#111', fontSize: 12, cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
                            {opt.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setStep(2)} style={{ padding: '9px 20px', border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                  <button disabled={!form.reason || !form.attendees_count} onClick={() => setStep(4)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: (form.reason && form.attendees_count) ? '#F5C800' : '#eee', color: '#111', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Continuar →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Datos de contacto</h2>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Nombre completo *</label>
                  {inp({ type: 'text', placeholder: 'Ana García', value: form.organizer_name, onChange: e => setForm(f => ({ ...f, organizer_name: e.target.value })) })}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Teléfono *</label>
                  {inp({ type: 'tel', placeholder: '+506 8888 8888', value: form.organizer_phone, onChange: e => setForm(f => ({ ...f, organizer_phone: e.target.value })) })}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Correo electrónico *</label>
                  {inp({ type: 'email', placeholder: 'ana@empresa.com', value: form.organizer_email, onChange: e => setForm(f => ({ ...f, organizer_email: e.target.value })) })}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 }}>Correos de invitados (separados por coma)</label>
                  {inp({ type: 'text', placeholder: 'juan@empresa.com, maria@empresa.com', value: form.guest_emails, onChange: e => setForm(f => ({ ...f, guest_emails: e.target.value })) })}
                  <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>Se les enviará invitación con enlace para agregar al calendario</p>
                </div>
                <div style={{ gridColumn: '1/-1', background: '#f9f9f7', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#666' }}>
                  <strong style={{ color: '#111', display: 'block', marginBottom: 4 }}>Resumen</strong>
                  {selectedRoom?.name} · {form.date} · {form.start_time} ({form.duration_hours}h) · {form.reason}
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setStep(3)} style={{ padding: '9px 20px', border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>← Atrás</button>
                  <button disabled={!form.organizer_name || !form.organizer_email || !form.organizer_phone || submitting} onClick={submit} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#F5C800', color: '#111', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Enviando...' : 'Enviar solicitud de reserva'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function ReservarPage() {
  return <Suspense><ReservarContent /></Suspense>
}
