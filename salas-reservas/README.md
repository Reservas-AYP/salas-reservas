# Sistema de Reserva de Salas

## Variables de entorno requeridas
Copia .env.example a .env.local y rellena los valores.

## Comandos
- `npm run dev` — desarrollo local
- `npm run build` — build de producción

## Rutas
- `/` — disponibilidad pública
- `/reservar` — formulario de reserva
- `/admin` — panel de administración (password protegido)
- `/cancelar/[token]` — cancelar reserva via link de correo
