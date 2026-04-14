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
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Vista general — sin datos personales. Para reservar usa el botón de cada sal
