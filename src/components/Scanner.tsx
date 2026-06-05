import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  Alert,
  Chip,
  IconButton,
  Divider,
  Snackbar,
} from '@mui/material'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ReplayIcon from '@mui/icons-material/Replay'
import UndoIcon from '@mui/icons-material/Undo'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined'
import type { Sticker } from '../types'
import { useCollection } from '../store/useCollection'
import { normalizeCode } from '../lib/ocrNormalize'
import { recognizeRegion, terminateOcr } from '../lib/ocr'
import { preprocessRegion, centeredGuide } from '../lib/imagePreprocess'

type Phase = 'idle' | 'starting' | 'scanning' | 'denied' | 'nocam' | 'insecure' | 'error'

interface ScanResult {
  match: Sticker | null
  corrected: boolean
  candidates: Sticker[]
  raw: string
}

interface HistoryItem {
  id: string
  label: string
  team: string
}

const LOOP_MS = 900

export default function Scanner() {
  const increment = useCollection((s) => s.increment)
  const decrement = useCollection((s) => s.decrement)
  const collection = useCollection((s) => s.collection)

  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [manual, setManual] = useState('')
  const [toast, setToast] = useState('')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processingRef = useRef(false)
  const pausedRef = useRef(false) // true mientras hay una sugerencia esperando decisión

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    pausedRef.current = false
    processingRef.current = false
  }, [])

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      stopCamera()
      void terminateOcr()
    }
  }, [stopCamera])

  const runTick = useCallback(async () => {
    if (processingRef.current || pausedRef.current) return
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    processingRef.current = true
    try {
      const region = centeredGuide(video.videoWidth, video.videoHeight)
      const canvas = preprocessRegion(video, region)
      const { text, confidence } = await recognizeRegion(canvas)
      if (!text.trim()) return
      const res = normalizeCode(text)
      if (res.match) {
        pausedRef.current = true
        setResult({ ...res, raw: text.trim() })
      } else if (res.candidates.length > 0 && confidence > 55) {
        pausedRef.current = true
        setResult({ ...res, raw: text.trim() })
      }
    } catch {
      /* fallo puntual de OCR: el próximo tick reintenta */
    } finally {
      processingRef.current = false
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setPhase('insecure')
      return
    }
    setPhase('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      setPhase('scanning')
      intervalRef.current = setInterval(() => void runTick(), LOOP_MS)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') setPhase('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setPhase('nocam')
      else setPhase('error')
    }
  }, [runTick])

  function resume() {
    setResult(null)
    pausedRef.current = false
  }

  function confirm(sticker: Sticker) {
    increment(sticker.id)
    setHistory((h) => [{ id: sticker.id, label: sticker.label ?? `#${sticker.number}`, team: sticker.team }, ...h].slice(0, 12))
    const next = (collection[sticker.id] ?? 0) + 1
    setToast(`${sticker.id} — ${sticker.label ?? `#${sticker.number}`} ✓ (x${next})`)
    resume()
  }

  function undo(item: HistoryItem) {
    decrement(item.id)
    setHistory((h) => {
      const i = h.findIndex((x) => x === item)
      if (i === -1) return h
      const copy = [...h]
      copy.splice(i, 1)
      return copy
    })
    setToast(`Deshecho: ${item.id}`)
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const res = normalizeCode(manual)
    if (res.match) {
      confirm(res.match)
      setManual('')
    } else if (res.candidates.length > 0) {
      pausedRef.current = true
      setResult({ ...res, raw: manual })
    } else {
      setToast('No encontré ese código. Probá de nuevo.')
    }
  }

  const scanning = phase === 'scanning' || phase === 'starting'

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h6">Escanear</Typography>
        {scanning && (
          <Button size="small" color="inherit" startIcon={<StopCircleOutlinedIcon />} onClick={() => { stopCamera(); setPhase('idle') }}>
            Detener
          </Button>
        )}
      </Box>

      {/* Cámara / inicio */}
      <Paper sx={{ p: phase === 'scanning' || phase === 'starting' ? 0 : 3, overflow: 'hidden' }}>
        {phase === 'idle' && (
          <Stack spacing={2} sx={{ py: 2, alignItems: 'center' }}>
            <CameraAltOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Apuntá la cámara al código de la figurita (ej. <b>ARG 5</b>). Te muestro cuál es y la
              marcás con un toque.
            </Typography>
            <Button variant="contained" size="large" startIcon={<CameraAltOutlinedIcon />} onClick={startCamera}>
              Activar cámara
            </Button>
          </Stack>
        )}

        {(phase === 'starting' || phase === 'scanning') && (
          <Box sx={{ position: 'relative', bgcolor: 'black', lineHeight: 0 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxHeight: '60vh', objectFit: 'cover' }}
            />
            {/* Recuadro guía */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  width: '75%',
                  height: '22%',
                  border: '2px solid',
                  borderColor: 'primary.light',
                  borderRadius: 1,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                }}
              />
            </Box>
            <Chip
              label={phase === 'starting' ? 'Iniciando…' : 'Buscando código…'}
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}
            />
          </Box>
        )}

        {phase === 'denied' && (
          <Alert severity="warning">
            No diste permiso a la cámara. Activálo en Ajustes → Safari → Cámara, o usá el campo de
            abajo para cargar el código a mano.
          </Alert>
        )}
        {phase === 'nocam' && (
          <Alert severity="warning">No encontré una cámara. Cargá el código a mano abajo.</Alert>
        )}
        {phase === 'insecure' && (
          <Alert severity="error">
            La cámara necesita HTTPS. En producción (Vercel) funciona; en desarrollo entrá por
            <code> localhost</code>. Mientras tanto, usá el campo de abajo.
          </Alert>
        )}
        {phase === 'error' && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={startCamera}>Reintentar</Button>}>
            No pude abrir la cámara.
          </Alert>
        )}
      </Paper>

      {/* Sugerencia / confirmación */}
      {result && (
        <Paper sx={{ p: 2.5 }} variant="outlined">
          {result.match ? (
            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary">
                Leí “{result.raw}” → {result.corrected && 'corregido a '}
                <b>{result.match.id}</b>
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  #{result.match.number} · {result.match.team}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.match.label} · tenés {collection[result.match.id] ?? 0}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => confirm(result.match!)} fullWidth>
                  Marcar como obtenida
                </Button>
                <Button variant="outlined" startIcon={<ReplayIcon />} onClick={resume}>
                  Otra
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                Leí “{result.raw}” pero no estoy seguro. ¿Es alguna de estas?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {result.candidates.map((s) => (
                  <Button key={s.id} size="small" variant="outlined" onClick={() => confirm(s)}>
                    {s.id} · {s.label}
                  </Button>
                ))}
              </Box>
              <Button size="small" startIcon={<ReplayIcon />} onClick={resume}>
                Seguir escaneando
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {/* Entrada manual (fallback) */}
      <Paper component="form" onSubmit={submitManual} sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Cargar a mano</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Si la cámara no lee bien, escribí el código (ej. <b>ARG5</b>) y marcala.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="ARG5"
            size="small"
            slotProps={{ htmlInput: { autoCapitalize: 'characters', autoCorrect: 'off', spellCheck: false } }}
            sx={{ flex: 1 }}
          />
          <Button type="submit" variant="contained" disabled={!manual.trim()}>
            Marcar
          </Button>
        </Stack>
      </Paper>

      {/* Historial de la sesión */}
      {history.length > 0 && (
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Escaneadas en esta sesión</Typography>
          <Stack divider={<Divider flexItem />} spacing={1}>
            {history.map((item, i) => (
              <Box key={`${item.id}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip size="small" label={item.id} />
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                  {item.label} · {item.team}
                </Typography>
                <IconButton size="small" onClick={() => undo(item)} aria-label="Deshacer">
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack>
  )
}
