import { Box, Paper, Typography, IconButton, Badge } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import type { Sticker } from '../types'
import { useCollection } from '../store/useCollection'

/** Inserta un separador entre el prefijo del país y el número: "ARG1" -> "ARG-1". */
function formatCode(code: string): string {
  return code.replace(/^([A-Za-z]+)(\d)/, '$1-$2')
}

export default function StickerCell({
  sticker,
  count,
  spareBadge = false,
  showCode = false,
}: {
  sticker: Sticker
  count: number
  /** Si es true, el badge muestra las repes que sobran (count-1) en vez del total. */
  spareBadge?: boolean
  /** Si es true, muestra el código real de la figurita (ej. "ARG1") para intercambios. */
  showCode?: boolean
}) {
  const increment = useCollection((s) => s.increment)
  const decrement = useCollection((s) => s.decrement)

  const owned = count >= 1
  const dup = count > 1
  const badgeCount = spareBadge ? count - 1 : count
  // En modo "sobrantes" solo mostramos el badge si sobra más de 1.
  const showBadge = spareBadge ? badgeCount > 1 : dup

  const borderColor = dup ? 'secondary.main' : owned ? 'success.main' : 'divider'
  const bg = dup ? 'rgba(241,196,15,0.14)' : owned ? 'rgba(46,204,113,0.14)' : 'background.paper'

  return (
    <Badge
      color="secondary"
      badgeContent={showBadge ? `x${badgeCount}` : 0}
      sx={{ width: '100%', '& .MuiBadge-badge': { fontWeight: 700 } }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          p: 1,
          borderColor,
          bgcolor: bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {showCode ? (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              px: 0.75,
              borderRadius: 1,
              bgcolor: 'action.selected',
            }}
          >
            {formatCode(sticker.id)}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            #{sticker.number}
          </Typography>
        )}
        <Typography
          variant="body2"
          noWrap
          title={sticker.label}
          sx={{ fontWeight: 600, maxWidth: '100%' }}
        >
          {sticker.label || sticker.team}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => decrement(sticker.id)}
            disabled={count === 0}
            aria-label="Restar"
            sx={{ bgcolor: 'action.selected' }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ width: 24, textAlign: 'center', fontWeight: 700 }}>{count}</Typography>
          <IconButton
            size="small"
            onClick={() => increment(sticker.id)}
            aria-label="Sumar"
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Badge>
  )
}
