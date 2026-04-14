import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reserva de Salas',
  description: 'Sistema de reserva de salas de reuniones',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
