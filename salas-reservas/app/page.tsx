'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Room, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'

type DayStatus = 'free' | 'partial' | 'full'

function getDayStatus(reservations: Reservation[], date: Date, roomId: string): DayStatus {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayRes = reservations.filter(r => r.room_id === roomId && r.date === dateStr && r.status !== 'cancelled')
  if (dayRes.length === 0) return 'free'
  const totalHours = dayRes.reduce((sum, r) => sum + r.duration_hours, 0)
  if (totalHours >= 8) return 'full'
  return 'partial'
}

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayLabels = ['L','M','X','J','V','S','D']

  useEffect(() => {
    async function load() {
      const [{ data: roomsData }, { data: resData }] = await Promise.all([
        supabase.from('rooms').select('*').eq('is_active', true).order('created_at'),
        supabase.from('reservations').select('room_id,date,duration_hours,status').neq('status','cancelled'),
      ])
      setRooms(roomsData || [])
      setReservations((resData as unknown as Reservation[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)' }}>
      <header style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
            Salas<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Corp</span>
          </div>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <span style={{ padding: '6px 14px', borderRadius: 'var(--radius)', background: 'var(--text)', color: 'var(--bg)', fontSize: 13 }}>Disponibilidad</span>
            <Link href="/reservar" style={{ padding: '6px 14px', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Reservar</Link>
            <Link href="/admin" style={{ padding: '6px 14px', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Admin</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Disponibilidad esta semana</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Vista general — sin datos personales. Para reservar usa el botón de cada sala.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)', fontSize: 14 }}>Cargando salas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {rooms.map(room => (
              <div key={room.id} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{room.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 14 }}>Capacidad: {room.capacity} personas</div>

                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Disponibilidad por día</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, textAlign: 'center' }}>
                  {dayLabels.map(d => <div key={d} style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>{d}</div>)}
                  {days.map((day, i) => {
                    const status = getDayStatus(reservations, day, room.id)
                    const isToday = isSameDay(day, new Date())
                    const colors = {
                      free: { bg: 'var(--green-bg)', c: 'var(--green-text)' },
                      partial: { bg: 'var(--amber-bg)', c: 'var(--amber-text)' },
                      full: { bg: 'var(--red-bg)', c: 'var(--red-text)' },
                    }
                    return (
                      <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: colors[status].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: colors[status].c, fontWeight: isToday ? 700 : 400, outline: isToday ? '2px solid var(--text)' : 'none', outlineOffset: 1 }}>
                        {format(day, 'd')}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 10 }}>
                  {(['free','partial','full'] as DayStatus[]).map(s => {
                    const labels = { free: 'Libre', partial: 'Parcial', full: 'Llena' }
                    const bgs = { free: 'var(--green-bg)', partial: 'var(--amber-bg)', full: 'var(--red-bg)' }
                    const cs = { free: 'var(--green-text)', partial: 'var(--amber-text)', full: 'var(--red-text)' }
                    return <span key={s} style={{ background: bgs[s], color: cs[s], padding: '2px 6px', borderRadius: 20 }}>{labels[s]}</span>
                  })}
                </div>

                <Link href={`/reservar?sala=${room.id}`} style={{ display: 'block', textAlign: 'center', marginTop: 14, padding: '8px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}>
                  Reservar esta sala →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
