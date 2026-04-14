export default function Footer() {
  return (
    <footer style={{
      borderTop: '0.5px solid rgba(255,255,255,0.08)',
      marginTop: 48,
      padding: '20px 24px',
      background: '#111',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 6 7 13H17C17 6 12 2 12 2Z" fill="#29ABE2"/>
          <path d="M9 13V18L12 20L15 18V13H9Z" fill="#1B3D7A"/>
          <circle cx="12" cy="9" r="2" fill="#1B3D7A"/>
          <path d="M7 13C7 13 5 14 5 16L7 15V13Z" fill="#29ABE2"/>
          <path d="M17 13C17 13 19 14 19 16L17 15V13Z" fill="#29ABE2"/>
        </svg>
        <span style={{ fontSize: 12, color: '#666' }}>
          Desarrollado por{' '}
          <a href="https://tecnologyapp.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#29ABE2', textDecoration: 'none', fontWeight: 500 }}>
            TecnologyApp
          </a>
          {' '}· {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
