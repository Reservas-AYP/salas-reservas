import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const passwordHash = createHash('sha256').update(password).digest('hex')
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('admin_users')
      .select('id, email, name, role')
      .eq('email', email)
      .eq('password_hash', passwordHash)
      .eq('is_active', true)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    return NextResponse.json({ success: true, user: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}