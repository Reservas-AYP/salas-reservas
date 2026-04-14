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
