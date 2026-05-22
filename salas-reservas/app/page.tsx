'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Room, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type DayStatus = 'free' | 'partial' | 'full' | 'past'

function getDayStatus(reservations: Reservation[], date: Date, roomId: string): DayStatus {
  const today = new Date()
  today.setHours(0,0,0,0)
  if (date < today) return 'past'
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayRes = reservations.filter(r => r.room_id === roomId && r.date === dateStr && r.status !== 'cancelled')
  if (dayRes.length === 0) return 'free'
  const totalHours = dayRes.reduce((sum, r) => sum + r.duration_hours, 0)
  if (totalHours >= 8) return 'full'
  return 'partial'
}

function MonthCalendar({ room, reservations, month }: { room: Room, reservations: Reservation[], month: Date }) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfMonth(month)
  const days: Date[] = []
  let cur = start
  while (cur <= end || days.length % 7 !== 0) {
    days.push(cur)
    cur = addDays(cur, 1)
    if (days.length > 42) break
  }
  const dayLabels = ['L','M','X','J','V','S','D']
  const colors = {
    free: { bg: '#EAF3DE', color: '#3B6D11' },
    partial: { bg: '#FAEEDA', color: '#854F0B' },
    full: { bg: '#FCEBEB', color: '#A32D2D' },
    past: { bg: '#f0efeb', color: '#ccc' },
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {dayLabels.map(d => (
          <div key={d} style={{ fontSize: 10, color: '#999', textAlign: 'center', padding: '2px 0', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, month)
          const isToday = isSameDay(day, new Date())
          const status = inMonth ? getDayStatus(reservations, day, room.id) : 'past'
          const c = colors[status]
          return (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: inMonth ? c.bg : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: inMonth ? c.color : '#ddd', fontWeight: isToday ? 700 : 400, outline: isToday ? '2px solid #111' : 'none', outlineOffset: 1 }}>
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date())

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
    <div style={{ minHeight: '100vh', background: '#f0efeb', display: 'flex', flexDirection: 'column' }}>
      <Header active="home" />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: '#111' }}>Disponibilidad de salas</h1>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Vista mensual — sin datos personales. Para reservar usa el botón de cada sala.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setMonth(m => subMonths(m, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111', minWidth: 140, textAlign: 'center', textTransform: 'capitalize' }}>
              {format(month, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999', fontSize: 14 }}>Cargando salas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {rooms.map(room => (
              <div key={room.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#111', marginBottom: 2 }}>{room.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Capacidad: {room.capacity} personas</div>
                <MonthCalendar room={room} reservations={reservations} month={month} />
                <div style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 10 }}>
                  <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '2px 6px', borderRadius: 20 }}>Libre</span>
                  <span style={{ background: '#FAEEDA', color: '#854F0B', padding: '2px 6px', borderRadius: 20 }}>Parcial</span>
                  <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '2px 6px', borderRadius: 20 }}>Llena</span>
                </div>
                <Link href={`/reservar?sala=${room.id}`} style={{ display: 'block', textAlign: 'center', marginTop: 14, padding: '9px', border: '0.5px solid #111', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none', fontWeight: 500 }}>
                  Reservar esta sala →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
