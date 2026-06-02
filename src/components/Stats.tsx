import { useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Divider,
} from '@mui/material'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { useCollection } from '../store/useCollection'
import { CATALOG } from '../data/catalog2026'
import { GROUP_LETTERS, GROUPS, groupOf } from '../data/groups'
import { computeOverall, computeByTeam, type TeamStats } from '../lib/stats'

export default function Stats() {
  const collection = useCollection((s) => s.collection)

  const overall = useMemo(() => computeOverall(CATALOG, collection), [collection])
  const teams = useMemo(
    // Solo selecciones nacionales (excluye "Especiales") para los rankings de países.
    () => computeByTeam(CATALOG, collection).filter((t) => groupOf(t.team) !== null),
    [collection],
  )

  const byOwned = useMemo(() => [...teams].sort((a, b) => b.owned - a.owned || b.percent - a.percent), [teams])
  const byPercent = useMemo(() => [...teams].sort((a, b) => b.percent - a.percent || b.owned - a.owned), [teams])
  const byMissing = useMemo(() => [...teams].sort((a, b) => b.missing - a.missing), [teams])
  const completed = useMemo(() => teams.filter((t) => t.total > 0 && t.percent === 100), [teams])

  const groups = useMemo(() => {
    const byName = new Map(teams.map((t) => [t.team, t]))
    return GROUP_LETTERS.map((l) => {
      const gteams = GROUPS[l].map((n) => byName.get(n)).filter(Boolean) as TeamStats[]
      const total = gteams.reduce((a, t) => a + t.total, 0)
      const owned = gteams.reduce((a, t) => a + t.owned, 0)
      return { letter: l, total, owned, percent: total ? Math.round((owned / total) * 100) : 0 }
    })
  }, [teams])
  const bestGroup = useMemo(() => [...groups].sort((a, b) => b.percent - a.percent)[0], [groups])
  const worstGroup = useMemo(() => [...groups].sort((a, b) => a.percent - b.percent)[0], [groups])

  const catalogById = useMemo(() => new Map(CATALOG.map((s) => [s.id, s])), [])
  const mostDup = useMemo(() => {
    let best: { label: string; team: string; count: number } | null = null
    for (const [id, c] of Object.entries(collection)) {
      if (c > 1 && (!best || c > best.count)) {
        const s = catalogById.get(id)
        if (s) best = { label: s.label ?? `#${s.number}`, team: s.team, count: c }
      }
    }
    return best
  }, [collection, catalogById])

  const avgPercent = useMemo(
    () => (teams.length ? Math.round(teams.reduce((a, t) => a + t.percent, 0) / teams.length) : 0),
    [teams],
  )

  const top = byOwned[0]
  const worst = byMissing[0]
  const bestPct = byPercent[0]

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Estadísticas</Typography>

      {/* Destacados */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Highlight
          icon={<StyleOutlinedIcon />}
          color="primary.main"
          label="Donde más figuritas tenés"
          value={top ? top.team : '—'}
          sub={top ? `${top.owned}/${top.total} pegadas` : ''}
        />
        <Highlight
          icon={<EmojiEventsOutlinedIcon />}
          color="success.main"
          label="Equipo más completo"
          value={bestPct ? bestPct.team : '—'}
          sub={bestPct ? `${bestPct.percent}% completado` : ''}
        />
        <Highlight
          icon={<TrendingDownOutlinedIcon />}
          color="error.main"
          label="El que más te falta"
          value={worst ? worst.team : '—'}
          sub={worst ? `${worst.missing} figuritas` : ''}
        />
        <Highlight
          icon={<CheckCircleOutlineIcon />}
          color="success.main"
          label="Equipos completos"
          value={`${completed.length} / ${teams.length}`}
          sub={completed.length ? completed.map((t) => t.team).join(', ') : 'Ninguno todavía'}
        />
      </Box>

      {/* Repetidas + promedio */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
        <Highlight
          icon={<RepeatOutlinedIcon />}
          color="secondary.main"
          label="La que más repetiste"
          value={mostDup ? mostDup.label : '—'}
          sub={mostDup ? `${mostDup.team} · x${mostDup.count}` : 'Sin repetidas'}
        />
        <Highlight
          icon={<GroupsOutlinedIcon />}
          color="primary.main"
          label="Mejor / peor grupo"
          value={bestGroup ? `Grupo ${bestGroup.letter} (${bestGroup.percent}%)` : '—'}
          sub={worstGroup ? `Peor: Grupo ${worstGroup.letter} (${worstGroup.percent}%)` : ''}
        />
      </Box>

      {/* Promedio general */}
      <Paper sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Promedio de avance por equipo</Typography>
          <Typography color="primary" sx={{ fontWeight: 700 }}>
            {avgPercent}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={avgPercent} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption" color="text.secondary">
          {overall.owned} pegadas · {overall.missing} faltan · {overall.extras} repes de sobra
        </Typography>
      </Paper>

      {/* Rankings */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        <RankingCard title="Top 5 más completos" rows={byPercent.slice(0, 5)} metric="percent" />
        <RankingCard title="Top 5 que más te faltan" rows={byMissing.slice(0, 5)} metric="missing" />
      </Box>
    </Stack>
  )
}

function Highlight({
  icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  color: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <Paper sx={{ p: 2.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color, mt: 0.3 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography noWrap sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="body2" color="text.secondary" noWrap title={sub}>
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

function RankingCard({
  title,
  rows,
  metric,
}: {
  title: string
  rows: TeamStats[]
  metric: 'percent' | 'missing'
}) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      <Stack divider={<Divider flexItem />} spacing={1.2}>
        {rows.map((t, i) => (
          <Box key={t.team} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography color="text.secondary" sx={{ width: 18 }}>
              {i + 1}
            </Typography>
            <Typography sx={{ flex: 1 }} noWrap>
              {t.team}
            </Typography>
            {metric === 'percent' ? (
              <>
                <Box sx={{ width: 70 }}>
                  <LinearProgress
                    variant="determinate"
                    value={t.percent}
                    color={t.percent === 100 ? 'success' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ width: 38, textAlign: 'right' }}>
                  {t.percent}%
                </Typography>
              </>
            ) : (
              <Chip size="small" color="error" variant="outlined" label={`${t.missing}`} />
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
