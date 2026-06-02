import { Box, Paper, Typography } from '@mui/material'

export default function ConfigMissing() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 460, textAlign: 'center' }}>
        <Typography variant="h6" color="warning.main" gutterBottom>
          Falta configurar Supabase
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Copiá <code>.env.example</code> a <code>.env.local</code> y completá{' '}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> con los datos de tu
          proyecto Supabase. Después reiniciá <code>npm run dev</code>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          ¿Solo querés probar la UI? Corré <code>npm run dev:local</code> (sin login ni nube).
        </Typography>
      </Paper>
    </Box>
  )
}
