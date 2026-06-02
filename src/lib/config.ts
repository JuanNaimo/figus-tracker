// Modo local de desarrollo: saltea Supabase (sin login, solo localStorage).
// Se activa con VITE_LOCAL_MODE=true (ver script `npm run dev:local`).
export const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true'

// Usuario falso usado en modo local (para la clave de cache y el header).
export const LOCAL_USER = { id: 'local-dev', email: 'dev@local' }
