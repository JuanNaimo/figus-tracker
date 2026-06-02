import { useRef, useState } from 'react'
import {
  Paper,
  Typography,
  Button,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useCollection } from '../store/useCollection'
import { CATALOG } from '../data/catalog2026'
import { toJsonBackup, parseJsonBackup, toCsv, parseCsv, downloadText } from '../lib/importExport'

type ImportMode = 'merge' | 'replace'

export default function ImportExportPanel() {
  const collection = useCollection((s) => s.collection)
  const replaceAll = useCollection((s) => s.replaceAll)
  const mergeAll = useCollection((s) => s.mergeAll)
  const reset = useCollection((s) => s.reset)

  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function exportJson() {
    downloadText('figus-backup.json', toJsonBackup(collection, new Date().toISOString()), 'application/json')
  }
  function exportCsv() {
    downloadText('figus.csv', toCsv(CATALOG, collection), 'text/csv')
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const isCsv = file.name.toLowerCase().endsWith('.csv')
      const incoming = isCsv ? parseCsv(text, CATALOG) : parseJsonBackup(text)
      const n = Object.keys(incoming).length
      if (mode === 'replace') replaceAll(incoming)
      else mergeAll(incoming)
      setMsg({ ok: true, text: `Importadas ${n} figuritas (${mode === 'replace' ? 'reemplazo' : 'fusión'}).` })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Error al importar.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function doReset() {
    reset()
    setConfirmOpen(false)
    setMsg({ ok: true, text: 'Colección reiniciada.' })
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exportar (backup)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tus datos ya se guardan en la nube, pero podés bajar una copia.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportJson} fullWidth>
            Exportar JSON
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} fullWidth>
            Exportar CSV
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Importar
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Cargá un archivo JSON o CSV. El CSV se mapea por <code>equipo</code> + <code>numero</code>.
        </Typography>
        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as ImportMode)}>
          <FormControlLabel value="merge" control={<Radio />} label="Fusionar (sumar)" />
          <FormControlLabel value="replace" control={<Radio />} label="Reemplazar" />
        </RadioGroup>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ mt: 1 }}>
          Elegir archivo
          <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" hidden onChange={onFile} />
        </Button>
      </Paper>

      {msg && <Alert severity={msg.ok ? 'success' : 'error'} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Paper sx={{ p: 3, borderColor: 'error.main' }} variant="outlined">
        <Typography variant="h6" color="error" gutterBottom>
          Zona peligrosa
        </Typography>
        <Button variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={() => setConfirmOpen(true)}>
          Vaciar colección
        </Button>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>¿Vaciar toda la colección?</DialogTitle>
        <DialogContent>
          <DialogContentText>Esto pone todas las figuritas en 0 y no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={doReset}>
            Vaciar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
