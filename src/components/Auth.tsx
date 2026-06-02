import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Stack,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { useAuth } from '../store/useAuth'

type Mode = 'login' | 'signup'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password)
      if (error) setError(error)
    } else {
      const { error, needsConfirm } = await signUp(email.trim(), password)
      if (error) setError(error)
      else if (needsConfirm)
        setInfo('Te enviamos un email para confirmar tu cuenta. Confirmalo y volvé a iniciar sesión.')
    }
    setBusy(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        <Stack spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
          <SportsSoccerIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Figus Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tu colección del Mundial 2026
          </Typography>
        </Stack>

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Typography>

          <Stack spacing={2}>
            <TextField
              type="email"
              label="Email"
              required
              fullWidth
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              type="password"
              label="Contraseña"
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 6 } }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
              {busy ? 'Espere…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
            </Button>
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <Link
            component="button"
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setInfo(null)
            }}
            sx={{ fontWeight: 700 }}
          >
            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
