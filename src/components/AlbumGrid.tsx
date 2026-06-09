import { useMemo, useState } from 'react'
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useCollection } from '../store/useCollection'
import { CATALOG, TEAMS_IN_ORDER } from '../data/catalog2026'
import { GROUP_LETTERS, GROUPS, groupOf } from '../data/groups'
import { filterStickers, type FilterOptions } from '../lib/filters'
import { countOf } from '../lib/stats'
import SearchFilter from './SearchFilter'
import StickerCell from './StickerCell'
import type { Sticker } from '../types'

interface Section {
  title: string
  teams: string[]
}

// Equipos que no pertenecen a ningún grupo (secciones especiales del álbum).
const SPECIAL_TEAMS = TEAMS_IN_ORDER.filter((t) => groupOf(t) === null)

// Secciones del modo navegación: 12 grupos + secciones especiales.
const SECTIONS: Section[] = [
  ...GROUP_LETTERS.map((l) => ({ title: `Grupo ${l}`, teams: GROUPS[l] })),
  ...SPECIAL_TEAMS.map((t) => ({ title: t, teams: [t] })),
]

// Mapa equipo -> figuritas (una sola vez).
const STICKERS_BY_TEAM: Record<string, Sticker[]> = (() => {
  const map: Record<string, Sticker[]> = {}
  for (const s of CATALOG) (map[s.team] ??= []).push(s)
  return map
})()

const GRID_SX = {
  display: 'grid',
  // En el teléfono fijamos 3 columnas; en pantallas más grandes se autollenan.
  gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(auto-fill, minmax(120px, 1fr))' },
  gap: 1,
} as const

export default function AlbumGrid() {
  const collection = useCollection((s) => s.collection)
  const [options, setOptions] = useState<FilterOptions>({ query: '', status: 'all', team: 'all' })

  const browsing = options.query.trim() === '' && options.status === 'all' && options.team === 'all'

  return (
    <Box>
      <SearchFilter options={options} onChange={setOptions} />
      {browsing ? (
        <GroupedView collection={collection} />
      ) : (
        <FilteredView collection={collection} options={options} />
      )}
    </Box>
  )
}

function GroupedView({ collection }: { collection: Record<string, number> }) {
  return (
    <Box>
      {SECTIONS.map((section) => {
        const stickers = section.teams.flatMap((t) => STICKERS_BY_TEAM[t] ?? [])
        const total = stickers.length
        const owned = stickers.reduce((n, s) => n + (countOf(collection, s.id) >= 1 ? 1 : 0), 0)
        const percent = total ? Math.round((owned / total) * 100) : 0
        return (
          <Accordion key={section.title} slotProps={{ transition: { unmountOnExit: true } }} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 2 }}>
                <Typography sx={{ fontWeight: 700, flex: 1 }}>
                  {section.title}
                </Typography>
                <Chip
                  size="small"
                  label={`${owned}/${total}`}
                  color={percent === 100 ? 'success' : 'default'}
                />
                <Box sx={{ width: 80 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    color={percent === 100 ? 'success' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {section.teams.map((team) => (
                <Box key={team} sx={{ mb: 2 }}>
                  {section.teams.length > 1 && (
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                      {team}
                    </Typography>
                  )}
                  <Box sx={GRID_SX}>
                    {(STICKERS_BY_TEAM[team] ?? []).map((s) => (
                      <StickerCell key={s.id} sticker={s} count={countOf(collection, s.id)} />
                    ))}
                  </Box>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

function FilteredView({
  collection,
  options,
}: {
  collection: Record<string, number>
  options: FilterOptions
}) {
  const filtered = useMemo(
    () => filterStickers(CATALOG, collection, options),
    [collection, options],
  )

  // Agrupar resultados por equipo conservando el orden del catálogo.
  const groups = useMemo(() => {
    const map = new Map<string, Sticker[]>()
    for (const s of filtered) {
      if (!map.has(s.team)) map.set(s.team, [])
      map.get(s.team)!.push(s)
    }
    return [...map.entries()]
  }, [filtered])

  if (filtered.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
        No hay figuritas con esos filtros.
      </Typography>
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filtered.length} figuritas
      </Typography>
      {groups.map(([team, stickers]) => (
        <Box key={team} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
            {team}
            {groupOf(team) && (
              <Chip size="small" label={`Grupo ${groupOf(team)}`} sx={{ ml: 1 }} variant="outlined" />
            )}
          </Typography>
          <Box sx={GRID_SX}>
            {stickers.map((s) => (
              <StickerCell key={s.id} sticker={s} count={countOf(collection, s.id)} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
