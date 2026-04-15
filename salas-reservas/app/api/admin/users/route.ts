import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function GET() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('admin_users').select('id, email, name, role, is_active, created_at').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, password } = await req.json()
    if (!email || !name || !role || !password) return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    const passwordHash = createHash('sha256').update(password).digest('hex')
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.from('admin_users').insert({ email, name, role, password_hash: passwordHash }).select('id, email, name, role').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('admin_users').update({ is_active: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}