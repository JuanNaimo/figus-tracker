import { useMemo, useState } from 'react'
import { Box, Typography, Button, Stack, Snackbar } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import { useCollection } from '../store/useCollection'
import { CATALOG } from '../data/catalog2026'
import { groupOf } from '../data/groups'
import { countOf } from '../lib/stats'
import { downloadText } from '../lib/importExport'
import StickerCell from './StickerCell'
import type { Sticker } from '../types'

export default function DuplicatesList() {
  const collection = useCollection((s) => s.collection)
  const [snack, setSnack] = useState(false)

  const items = useMemo(() => CATALOG.filter((s) => countOf(collection, s.id) > 1), [collection])
  const totalExtras = useMemo(
    () => items.reduce((n, s) => n + (countOf(collection, s.id) - 1), 0),
    [items, collection],
  )
  const text = useMemo(() => buildText(items, collection), [items, collection])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setSnack(true)
    } catch {
      /* ignorar */
    }
  }

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
        Todavía no tenés repetidas.
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6">
          {items.length} distintas · {totalExtras} de sobra
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
            Copiar lista
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => downloadText('repetidas.txt', text)}>
            Exportar
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tocá − cuando entregues una repetida en un intercambio.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
        {items.map((s) => (
          <StickerCell key={s.id} sticker={s} count={countOf(collection, s.id)} spareBadge showCode />
        ))}
      </Box>

      <Snackbar open={snack} autoHideDuration={1500} onClose={() => setSnack(false)} message="¡Lista copiada!" />
    </Box>
  )
}

function buildText(items: Sticker[], collection: Record<string, number>): string {
  const lines = ['Figuritas repetidas (para cambiar):', '']
  for (const s of items) {
    const extra = (collection[s.id] ?? 0) - 1
    const g = groupOf(s.team)
    lines.push(`${s.id} · ${s.team}${g ? ` (Grupo ${g})` : ''}${s.label ? ` - ${s.label}` : ''} (x${extra})`)
  }
  return lines.join('\n')
}
