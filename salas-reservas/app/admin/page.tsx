'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/lib/supabase'
import Link from 'next/link'

type AdminUser = { id: string; email: string; name: string; role: 'master' | 'approver'; is_active?: boolean }
type Room = { id: string; name: string; capacity: number; is_active: boolean }
type ConfigOption = { id: string; label: string }
type Tab = 'reservations' | 'rooms' | 'config' | 'users'

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('reservations')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [configOpts, setConfigOpts] = useState<ConfigOption[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [filter, setFilter] = useState<'pending'|'all'|'approved'|'cancelled'>('pending')
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' })
  const [newConfig, setNewConfig] = useState('')
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'approver', password: '' })
  const [msg, setMsg] = useState('')

  async function login() {
    setLoginError('')
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) })
    const data = await res.json()
    if (!res.ok) { setLoginError(data.error || 'Error al iniciar sesión'); return }
    setUser(data.user)
    loadAll(data.user)
  }

  async function loadAll(u?: AdminUser) {
    const cu = u || user
    const [resRes, roomsRes, configRes] = await Promise.all([
      supabase.from('reservations').select('*, rooms(name)').order('created_at', { ascending: false }),
      fetch('/api/admin/rooms'),
      fetch('/api/admin/config'),
    ])
    setReservations((resRes.data as unknown as Reservation[]) || [])
    setRooms(await roomsRes.json())
    setConfigOpts(await configRes.json())
    if (cu?.role === 'master') {
      const usersRes = await fetch('/api/admin/users')
      setAdminUsers(await usersRes.json())
    }
  }

  async function approve(id: string) {
    await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll()
  }

  async function cancelRes(cancel_token: string) {
    await fetch('/api/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancel_token }) })
    loadAll()
  }

  async function addRoom() {
    if (!newRoom.name || !newRoom.capacity) return
    const res = await fetch('/api/admin/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) })
    const data = await res.json()
    if (!res.ok) { setMsg('Error: ' + data.error); return }
    setNewRoom({ name: '', capacity: '' })
    setMsg('✓ Sala creada exitosamente')
    loadAll()
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteRoom(id: string) {
    await fetch('/api/admin/rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll()
  }

  async function addConfig() {
    if (!newConfig.trim()) return
    const res = await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: newConfig.trim() }) })
    if (!res.ok) return
    setNewConfig('')
    setMsg('✓ Opción agregada')
    loadAll()
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteConfig(id: string) {
    await fetch('/api/admin/config', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll()
  }

  async function addUser() {
    if (!newUser.email || !newUser.name || !newUser.password) return
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) })
    const data = await res.json()
    if (!res.ok) { setMsg('Error: ' + data.error); return }
    setNewUser({ email: '', name: '', role: 'approver', password: '' })
    setMsg('✓ Usuario creado exitosamente')
    loadAll()
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteUser(id: string) {
    await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll()
  }

  const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 13, color: '#111', background: '#fff', outline: 'none', width: '100%' }} />
  )

  function badge(status: string) {
    const s: Record<string, {bg:string,color:string,label:string}> = {
      pending: { bg: '#FAEEDA', color: '#854F0B', label: 'Pendiente' },
      approved: { bg: '#EAF3DE', color: '#3B6D11', label: 'Aprobada' },
      cancelled: { bg: '#F1EFE8', color: '#5F5E5A', label: 'Cancelada' },
    }
    const st = s[status] || s.pending
    return <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: st.bg, color: st.color }}>{st.label}</span>
  }

  function roleBadge(role: string) {
    return <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: role === 'master' ? '#111' : '#EAF3DE', color: role === 'master' ? '#F5C800' : '#3B6D11' }}>{role === 'master' ? 'Master' : 'Aprobador'}</span>
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#f0efeb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', padding: '2.5rem', maxWidth: 380, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/logo-ayp.png" alt="AYP" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>AYP — Admin</div>
            <div style={{ fontSize: 11, color: '#666' }}>Panel de administración</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5 }}>Correo electrónico</label>
          {inp({ type: 'email', placeholder: 'admin@empresa.com', value: loginEmail, onChange: e => setLoginEmail(e.target.value) })}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5 }}>Contraseña</label>
          {inp({ type: 'password', placeholder: '••••••••', value: loginPassword, onChange: e => setLoginPassword(e.target.value), onKeyDown: e => e.key === 'Enter' && login() })}
        </div>
        {loginError && <p style={{ color: '#A32D2D', fontSize: 12, marginBottom: 12 }}>{loginError}</p>}
        <button onClick={login} style={{ width: '100%', padding: '10px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Ingresar</button>
      </div>
    </div>
  )

  const filteredRes = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)
  const tabs: { key: Tab, label: string, show: boolean }[] = [
    { key: 'reservations', label: 'Reservas', show: true },
    { key: 'rooms', label: 'Salas', show: user.role === 'master' },
    { key: 'config', label: 'Configuración', show: user.role === 'master' },
    { key: 'users', label: 'Usuarios', show: user.role === 'master' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0efeb' }}>
      <header style={{ background: '#111', borderBottom: '3px solid #F5C800', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo-ayp.png" alt="AYP" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>AYP Admin</span>
            {roleBadge(user.role)}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#888' }}>{user.name}</span>
            <Link href="/" style={{ padding: '5px 12px', borderRadius: 6, color: '#888', fontSize: 12, textDecoration: 'none', border: '0.5px solid #333' }}>← Ver sitio</Link>
            <button onClick={() => setUser(null)} style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', color: '#888', fontSize: 12, border: '0.5px solid #333', cursor: 'pointer' }}>Salir</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {msg && <div style={{ background: '#EAF3DE', border: '0.5px solid #9FE1CB', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#3B6D11', marginBottom: 16 }}>{msg}</div>}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {tabs.filter(t => t.show).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 13, cursor: 'pointer', background: tab === t.key ? '#111' : '#fff', color: tab === t.key ? '#fff' : '#666', fontWeight: tab === t.key ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'reservations' && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['pending','all','approved','cancelled'] as const).map(f => {
                const labels = { pending: 'Pendientes', all: 'Todas', approved: 'Aprobadas', cancelled: 'Canceladas' }
                const count = f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length
                return <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 12, cursor: 'pointer', background: filter === f ? '#111' : '#fff', color: filter === f ? '#fff' : '#666' }}>{labels[f]} ({count})</button>
              })}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                      {['Sala','Solicitante','Fecha · Hora','Motivo','Pax','Café','Config.','Estado','Acciones'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#666', whiteSpace: 'nowrap', background: '#fafaf8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRes.map(r => (
                      <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500 }}>{(r as any).rooms?.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 500 }}>{r.organizer_name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{r.organizer_email}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{r.organizer_phone}</div>
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div>{r.date}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{r.start_time?.slice(0,5)} · {r.duration_hours}h</div>
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 160 }}>{r.reason}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>{r.attendees_count}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11 }}>
                          {r.needs_coffee ? <span style={{ color: '#3B6D11' }}>Sí · {r.coffee_time?.slice(0,5)}</span> : <span style={{ color: '#999' }}>No</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, maxWidth: 120 }}>{(r.config_options||[]).join(', ')||'—'}</td>
                        <td style={{ padding: '12px 14px' }}>{badge(r.status)}</td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => approve(r.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #9FE1CB', background: '#EAF3DE', color: '#3B6D11', fontSize: 11, cursor: 'pointer' }}>Aprobar</button>
                              <button onClick={() => cancelRes(r.cancel_token)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', fontSize: 11, cursor: 'pointer' }}>Rechazar</button>
                            </div>
                          )}
                          {r.status === 'approved' && (
                            <button onClick={() => cancelRes(r.cancel_token)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', color: '#666', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRes.length === 0 && <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#999', fontSize: 13 }}>No hay reservas en esta categoría</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'rooms' && user.role === 'master' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {rooms.filter(r => r.is_active).map(r => (
                <div key={r.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Capacidad: {r.capacity} personas</div>
                  </div>
                  <button onClick={() => deleteRoom(r.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', fontSize: 11, cursor: 'pointer' }}>Eliminar</button>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agregar nueva sala</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Nombre</label>
                  {inp({ placeholder: 'Sala Innovación', value: newRoom.name, onChange: e => setNewRoom(n => ({...n, name: e.target.value})) })}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Capacidad máx.</label>
                  {inp({ type: 'number', placeholder: '20', value: newRoom.capacity, onChange: e => setNewRoom(n => ({...n, capacity: e.target.value})) })}
                </div>
                <button onClick={addRoom} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Agregar</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'config' && user.role === 'master' && (
          <div style={{ maxWidth: 600 }}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Estas opciones aparecen en el formulario de reserva.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {configOpts.map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 13, background: '#fff' }}>
                  {opt.label}
                  <button onClick={() => deleteConfig(opt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
              {configOpts.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>No hay opciones configuradas</p>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {inp({ placeholder: 'Ej: Pizarrón magnético', value: newConfig, onChange: e => setNewConfig(e.target.value), onKeyDown: e => e.key === 'Enter' && addConfig() })}
              <button onClick={addConfig} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Agregar</button>
            </div>
          </div>
        )}

        {tab === 'users' && user.role === 'master' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {adminUsers.filter(u => u.is_active).map(u => (
                <div key={u.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</span>
                      {roleBadge(u.role)}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{u.email}</div>
                  </div>
                  {u.email !== loginEmail && (
                    <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', fontSize: 11, cursor: 'pointer' }}>Eliminar</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agregar nuevo usuario admin</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Nombre</label>
                  {inp({ placeholder: 'María García', value: newUser.name, onChange: e => setNewUser(n => ({...n, name: e.target.value})) })}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Correo</label>
                  {inp({ type: 'email', placeholder: 'maria@empresa.com', value: newUser.email, onChange: e => setNewUser(n => ({...n, email: e.target.value})) })}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Contraseña</label>
                  {inp({ type: 'password', placeholder: '••••••••', value: newUser.password, onChange: e => setNewUser(n => ({...n, password: e.target.value})) })}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Rol</label>
                  <select value={newUser.role} onChange={e => setNewUser(n => ({...n, role: e.target.value}))} style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 13, color: '#111', background: '#fff', width: '100%' }}>
                    <option value="approver">Aprobador — puede aprobar reservas</option>
                    <option value="master">Master — acceso completo</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <button onClick={addUser} style={{ width: '100%', padding: '9px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Crear usuario</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
