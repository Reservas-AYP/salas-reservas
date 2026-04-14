import Link from 'next/link'

export default function Header({ active }: { active: 'home' | 'reservar' | 'admin' }) {
  return (
    <header style={{ background: '#111', borderBottom: '3px solid #F5C800', padding: '0 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#F5C800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#111', letterSpacing: '-0.5px',
            flexShrink: 0
          }}>
            a&p
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>AYP</div>
            <div style={{ fontSize: 10, color: '#F5C800', fontWeight: 500, letterSpacing: '0.5px' }}>RESERVA DE SALAS</div>
          </div>
        </div>

        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <Link href="/" style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
            background: active === 'home' ? '#F5C800' : 'transparent',
            color: active === 'home' ? '#111' : '#aaa',
            fontWeight: active === 'home' ? 600 : 400,
          }}>Disponibilidad</Link>
          <Link href="/reservar" style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
            background: active === 'reservar' ? '#F5C800' : 'transparent',
            color: active === 'reservar' ? '#111' : '#aaa',
            fontWeight: active === 'reservar' ? 600 : 400,
          }}>Reservar</Link>
          <Link href="/admin" style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
            background: active === 'admin' ? '#F5C800' : 'transparent',
            color: active === 'admin' ? '#111' : '#aaa',
            fontWeight: active === 'admin' ? 600 : 400,
          }}>Admin</Link>
        </nav>
      </div>
    </header>
  )
}
