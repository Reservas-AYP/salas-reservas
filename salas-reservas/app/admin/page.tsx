'use client'
import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Room, Reservation, ConfigOption } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin1234'

type Tab = 'reservations' | 'rooms' | 'config'

function badge(status: string) {
  const styles: Record<string, { bg: string, color: string, label: string }> = {
    pending: { bg: 'var(--amber-bg)', color: 'var(--amber-text)', label: 'Pendiente' },
    approved: { bg: 'var(--green-bg)', color: 'var(--green-text)', label: 'Aprobada' },
    cancelled: { bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', label: 'Cancelada' },
  }
  const s = styles[status] || styles.pending
  return <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('reservations')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [configOpts, setConfigOpts] = useState<ConfigOption[]>([])
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' })
  const [newConfig, setNewConfig] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled'>('pending')

  async function loadAll() {
    setLoading(true)
    const [{ data: res }, { data: rms }, { data: opts }] = await Promise.all([
      supabase.from('reservations').select('*, rooms(name)').order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').order('created_at'),
      supabase.from('room_config_options').select('*').order('created_at'),
    ])
    setReservations((res as unknown as Reservation[]) || [])
    setRooms(rms || [])
    setConfigOpts(opts || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) loadAll() }, [authed])

  async function approve(id: string) {
    await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll()
  }

  async function cancelRes(id: string, cancel_token: string) {
    await fetch('/api/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancel_token }) })
    loadAll()
  }

  async function addRoom() {
    if (!newRoom.name || !newRoom.capacity) return
    await supabase.from('rooms').insert({ name: newRoom.name, capacity: Number(newRoom.capacity) })
    setNewRoom({ name: '', capacity: '' })
    loadAll()
  }

  async function deleteRoom(id: string) {
    await supabase.from('rooms').update({ is_active: false }).eq('id', id)
    loadAll()
  }

  async function addConfig() {
    if (!newConfig.trim()) return
    await supabase.from('room_config_options').insert({ label: newConfig.trim() })
    setNewConfig('')
    loadAll()
  }

  async function deleteConfig(id: string) {
    await supabase.from('room_config_options').update({ is_active: false }).eq('id', id)
    loadAll()
  }

  const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '0.5px solid var(--border-strong)', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '100%' }} />
  )

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)', padding: '2.5rem', maxWidth: 360, width: '100%' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Panel de administración</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Ingresa tu contraseña para continuar</p>
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && (password === ADMIN_PASS ? setAuthed(true) : alert('Contraseña incorrecta'))} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '0.5px solid var(--border-strong)', fontSize: 14, marginBottom: 12, outline: 'none' }} />
        <button onClick={() => password === ADMIN_PASS ? setAuthed(true) : alert('Contraseña incorrecta')} style={{ width: '100%', padding: '10px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, cursor: 'pointer' }}>
          Ingresar
        </button>
      </div>
    </div>
  )

  const filteredRes = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)' }}>
      <header style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Salas<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Corp</span> <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>— Admin</span></div>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <Link href="/" style={{ padding: '6px 14px', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>← Ver sitio</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['reservations','rooms','config'] as Tab[]).map(t => {
            const labels = { reservations: 'Reservas', rooms: 'Salas', config: 'Configuración' }
            return (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 'var(--radius)', border: '0.5px solid var(--border-strong)', fontSize: 13, cursor: 'pointer', background: tab === t ? 'var(--text)' : 'transparent', color: tab === t ? 'var(--bg)' : 'var(--text-secondary)' }}>
                {labels[t]}
              </button>
            )
          })}
        </div>

        {/* RESERVAS */}
        {tab === 'reservations' && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['pending','all','approved','cancelled'] as const).map(f => {
                const labels = { pending: 'Pendientes', all: 'Todas', approved: 'Aprobadas', cancelled: 'Canceladas' }
                const count = f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid var(--border-strong)', fontSize: 12, cursor: 'pointer', background: filter === f ? 'var(--text)' : 'transparent', color: filter === f ? 'var(--bg)' : 'var(--text-secondary)' }}>
                    {labels[f]} ({count})
                  </button>
                )
              })}
            </div>
            <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      {['Sala','Solicitante','Fecha · Hora','Motivo','Pax','Café','Config.','Estado','Acciones'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRes.map(r => (
                      <tr key={r.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{(r as any).rooms?.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 500 }}>{r.organizer_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.organizer_email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.organizer_phone}</div>
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div>{r.date}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.start_time?.slice(0,5)} · {r.duration_hours}h</div>
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 180 }}>{r.reason}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>{r.attendees_count}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11 }}>
                          {r.needs_coffee ? <span style={{ color: 'var(--green-text)' }}>Sí · {r.coffee_time?.slice(0,5)}</span> : <span style={{ color: 'var(--text-tertiary)' }}>No</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, maxWidth: 140 }}>{(r.config_options || []).join(', ') || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{badge(r.status)}</td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => approve(r.id)} style={{ padding: '4px 10px', borderRadius: 'var(--radius)', border: '0.5px solid var(--green-border)', background: 'var(--green-bg)', color: 'var(--green-text)', fontSize: 11, cursor: 'pointer' }}>Aprobar</button>
                              <button onClick={() => cancelRes(r.id, r.cancel_token)} style={{ padding: '4px 10px', borderRadius: 'var(--radius)', border: '0.5px solid var(--red-border)', background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 11, cursor: 'pointer' }}>Rechazar</button>
                            </div>
                          )}
                          {r.status === 'approved' && (
                            <button onClick={() => cancelRes(r.id, r.cancel_token)} style={{ padding: '4px 10px', borderRadius: 'var(--radius)', border: '0.5px solid var(--border-strong)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRes.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No hay reservas en esta categoría</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* SALAS */}
        {tab === 'rooms' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Salas registradas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {rooms.map(r => (
                <div key={r.id} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Capacidad: {r.capacity} personas</div>
                  </div>
                  <button onClick={() => deleteRoom(r.id)} style={{ padding: '4px 10px', borderRadius: 'var(--radius)', border: '0.5px solid var(--red-border)', background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 11, cursor: 'pointer' }}>Eliminar</button>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Agregar nueva sala</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre</label>
                  {inp({ placeholder: 'Sala Innovación', value: newRoom.name, onChange: e => setNewRoom(n => ({ ...n, name: e.target.value })) })}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Capacidad</label>
                  {inp({ type: 'number', placeholder: '20', value: newRoom.capacity, onChange: e => setNewRoom(n => ({ ...n, capacity: e.target.value })) })}
                </div>
                <button onClick={addRoom} style={{ padding: '8px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Agregar</button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIG */}
        {tab === 'config' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Opciones de configuración de sala</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Estas opciones aparecen en el formulario de reserva (manteles, sillas, etc.)</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {configOpts.map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: '0.5px solid var(--border-strong)', fontSize: 13, background: 'var(--bg)' }}>
                  {opt.label}
                  <button onClick={() => deleteConfig(opt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {inp({ placeholder: 'Ej: Pizarrón magnético', value: newConfig, onChange: e => setNewConfig(e.target.value), onKeyDown: e => e.key === 'Enter' && addConfig() })}
              <button onClick={addConfig} style={{ padding: '8px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Agregar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
