'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function CancelarPage() {
  const { token } = useParams()
  const [state, setState] = useState<'confirm' | 'loading' | 'done' | 'error'>('confirm')
  const [errorMsg, setErrorMsg] = useState('')

  async function cancel() {
    setState('loading')
    const res = await fetch('/api/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancel_token: token }) })
    const data = await res.json()
    if (res.ok) setState('done')
    else { setErrorMsg(data.error || 'Error desconocido'); setState('error') }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)', padding: '2.5rem', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {state === 'confirm' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Cancelar reserva</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              ¿Estás seguro/a que deseas cancelar esta reserva? La sala quedará disponible inmediatamente para otras personas.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/" style={{ flex: 1, padding: '10px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'var(--text)', fontSize: 14, textAlign: 'center' }}>No, volver</Link>
              <button onClick={cancel} style={{ flex: 1, padding: '10px', background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, cursor: 'pointer' }}>Sí, cancelar</button>
            </div>
          </>
        )}
        {state === 'loading' && <p style={{ color: 'var(--text-secondary)' }}>Cancelando...</p>}
        {state === 'done' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Reserva cancelada</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>La sala quedó disponible inmediatamente. Recibirás un correo de confirmación.</p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--text)', color: 'var(--bg)', borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: 14 }}>Ver disponibilidad</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Error</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--text)', color: 'var(--bg)', borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: 14 }}>Ir al inicio</Link>
          </>
        )}
      </div>
    </div>
  )
}
