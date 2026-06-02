import { useMemo, useState } from 'react'
import { Box, Paper, Typography, Button, Chip, Stack, Snackbar } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import { useCollection } from '../store/useCollection'
import { CATALOG } from '../data/catalog2026'
import { groupOf } from '../data/groups'
import { countOf } from '../lib/stats'
import { downloadText } from '../lib/importExport'
import type { Sticker } from '../types'

export default function MissingList() {
  const collection = useCollection((s) => s.collection)
  const [snack, setSnack] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, Sticker[]>()
    for (const s of CATALOG) {
      if (countOf(collection, s.id) === 0) {
        if (!map.has(s.team)) map.set(s.team, [])
        map.get(s.team)!.push(s)
      }
    }
    return [...map.entries()]
  }, [collection])

  const total = useMemo(() => groups.reduce((n, [, l]) => n + l.length, 0), [groups])
  const text = useMemo(() => buildText(groups), [groups])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setSnack(true)
    } catch {
      /* el navegador puede bloquearlo sin https */
    }
  }

  if (total === 0) {
    return (
      <Typography color="success.main" align="center" sx={{ py: 6 }}>
        ¡No te falta ninguna! 🎉
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6">Me faltan {total}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
            Copiar lista
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => downloadText('faltantes.txt', text)}>
            Exportar
          </Button>
        </Stack>
      </Box>

      <Stack spacing={1.5}>
        {groups.map(([team, list]) => (
          <Paper key={team} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography color="primary" sx={{ fontWeight: 700, flex: 1 }}>
                {team}
              </Typography>
              {groupOf(team) && <Chip size="small" variant="outlined" label={`Grupo ${groupOf(team)}`} />}
              <Chip size="small" label={list.length} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {list.map((s) => `#${s.number}`).join(', ')}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Snackbar open={snack} autoHideDuration={1500} onClose={() => setSnack(false)} message="¡Lista copiada!" />
    </Box>
  )
}

function buildText(groups: [string, Sticker[]][]): string {
  const lines = ['Figuritas que me faltan:', '']
  for (const [team, list] of groups) {
    const g = groupOf(team)
    lines.push(`${team}${g ? ` (Grupo ${g})` : ''}: ${list.map((s) => `#${s.number}`).join(', ')}`)
  }
  return lines.join('\n')
}
