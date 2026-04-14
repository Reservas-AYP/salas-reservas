'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Room, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
    <div style={{ minHeight: '100vh', background: '#f0efeb', display: 'flex', flexDirection: 'column' }}>
      <Header active="home" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: '#111' }}>Disponibilidad esta semana</h1>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Vista general sin datos personales. Para reservar usa el botón de cada sala.</p>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999', fontSize: 14 }}>Cargando salas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {rooms.map(room => (
              <div key={room.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontWeight: 500, fontSize: 15, color: '#111' }}>{room.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 14 }}>Capacidad: {room.capacity} personas</div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Disponibilidad por día</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, textAlign: 'center' }}>
                  {dayLabels.map(d => <div key={d} style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>{d}</div>)}
                  {days.map((day, i) => {
                    const status = getDayStatus(reservations, day, room.id)
                    const isToday = isSameDay(day, new Date())
                    const colors = { free: { bg: '#EAF3DE', c: '#3B6D11' }, partial: { bg: '#FAEEDA', c: '#854F0B' }, full: { bg: '#FCEBEB', c: '#A32D2D' } }
                    return (
                      <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: colors[status].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: colors[status].c, fontWeight: isToday ? 700 : 400, outline: isToday ? '2px solid #111' : 'none', outlineOffset: 1 }}>
                        {format(day, 'd')}
                      </div>
                    )
                  })}
                </div>
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
)}
        )}
      </main>
      <Footer />
    </div>
  )
}
