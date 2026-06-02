import { useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useCollection } from '../store/useCollection'
import { CATALOG, TEAMS_IN_ORDER } from '../data/catalog2026'
import { GROUP_LETTERS, GROUPS, groupOf } from '../data/groups'
import { computeOverall, computeByTeam, type TeamStats } from '../lib/stats'

interface GroupStats {
  title: string
  teams: TeamStats[]
  total: number
  owned: number
  percent: number
}

const SPECIAL_TEAMS = TEAMS_IN_ORDER.filter((t) => groupOf(t) === null)

export default function Dashboard() {
  const collection = useCollection((s) => s.collection)
  const overall = useMemo(() => computeOverall(CATALOG, collection), [collection])
  const byTeam = useMemo(() => computeByTeam(CATALOG, collection), [collection])

  const groups = useMemo<GroupStats[]>(() => {
    const byName = new Map(byTeam.map((t) => [t.team, t]))
    const build = (title: string, teamNames: string[]): GroupStats => {
      const teams = teamNames.map((n) => byName.get(n)).filter(Boolean) as TeamStats[]
      const total = teams.reduce((a, t) => a + t.total, 0)
      const owned = teams.reduce((a, t) => a + t.owned, 0)
      return { title, teams, total, owned, percent: total ? Math.round((owned / total) * 100) : 0 }
    }
    return [
      ...GROUP_LETTERS.map((l) => build(`Grupo ${l}`, GROUPS[l])),
      ...SPECIAL_TEAMS.map((t) => build(t, [t])),
    ]
  }, [byTeam])

  return (
    <Stack spacing={3}>
      {/* Progreso general */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Progreso del álbum</Typography>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 800 }}>
            {overall.percent}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={overall.percent} sx={{ height: 10, borderRadius: 5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {overall.owned} de {overall.total} figuritas
        </Typography>
      </Paper>

      {/* Tarjetas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <StatCard label="Tengo" value={overall.owned} color="success.main" />
        <StatCard label="Me faltan" value={overall.missing} color="text.primary" />
        <StatCard label="Repetidas" value={overall.duplicates} color="secondary.main" />
        <StatCard label="Repes de sobra" value={overall.extras} color="secondary.main" />
      </Box>

      {/* Progreso por grupo */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Progreso por grupo
        </Typography>
        {groups.map((g) => (
          <Accordion key={g.title} slotProps={{ transition: { unmountOnExit: true } }} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 2 }}>
                <Typography sx={{ fontWeight: 700, flex: 1 }}>
                  {g.title}
                </Typography>
                <Chip size="small" label={`${g.owned}/${g.total}`} color={g.percent === 100 ? 'success' : 'default'} />
                <Box sx={{ width: 90 }}>
                  <LinearProgress
                    variant="determinate"
                    value={g.percent}
                    color={g.percent === 100 ? 'success' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                {g.teams.map((t) => (
                  <Box key={t.team}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{t.team}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.owned}/{t.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={t.percent}
                      color={t.percent === 100 ? 'success' : 'primary'}
                      sx={{ height: 5, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Stack>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  )
}
