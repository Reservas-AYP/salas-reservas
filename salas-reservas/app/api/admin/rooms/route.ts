import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('rooms').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const { name, capacity } = await req.json()
    if (!name || !capacity) return NextResponse.json({ error: 'Nombre y capacidad requeridos' }, { status: 400 })
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.from('rooms').insert({ name, capacity: Number(capacity), is_active: true }).select().single()
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
    const { error } = await admin.from('rooms').update({ is_active: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}