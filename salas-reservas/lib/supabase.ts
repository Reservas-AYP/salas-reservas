import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público — para usar en el navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin — solo para usar en API routes (servidor)
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

export type Room = {
  id: string
  name: string
  capacity: number
  is_active: boolean
  created_at: string
}

export type ConfigOption = {
  id: string
  label: string
  is_active: boolean
}

export type Reservation = {
  id: string
  cancel_token: string
  room_id: string
  organizer_name: string
  organizer_email: string
  organizer_phone: string
  date: string
  start_time: string
  duration_hours: number
  reason: string
  attendees_count: number
  needs_coffee: boolean
  coffee_time: string | null
  config_options: string[]
  guest_emails: string[]
  status: 'pending' | 'approved' | 'cancelled'
  admin_notes: string | null
  created_at: string
  rooms?: Room
}
