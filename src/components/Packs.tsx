import { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  IconButton,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined'
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined'
import { useCollection } from '../store/useCollection'
import { usePacks } from '../store/usePacks'
import { CATALOG } from '../data/catalog2026'
import { computeOverall } from '../lib/stats'
import {
  summarizePacks,
  buildTimeline,
  predict,
  formatMoney,
  formatDecimal,
} from '../lib/packStats'
import MiniAreaChart, { type ChartPoint } from './MiniAreaChart'

/** Fecha de hoy en formato yyyy-mm-dd para el input date. */
function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Packs() {
  const collection = useCollection((s) => s.collection)
  const packs = usePacks((s) => s.packs)
  const addPack = usePacks((s) => s.add)
  const removePack = usePacks((s) => s.remove)

  const overall = useMemo(() => computeOverall(CATALOG, collection), [collection])
  const summary = useMemo(() => summarizePacks(packs), [packs])
  const prediction = useMemo(
    () => predict(summary, overall.owned, overall.total),
    [summary, overall.owned, overall.total],
  )

  const timeline = useMemo(
    () => buildTimeline(packs, overall.owned, overall.total, new Date().toISOString()),
    [packs, overall.owned, overall.total],
  )
  const chartPoints = useMemo<ChartPoint[]>(
    () => timeline.map((p) => ({ label: p.date, value: p.percent })),
    [timeline],
  )

  // Form
  const [qty, setQty] = useState('1')
  const [cost, setCost] = useState('')
  const [news, setNews] = useState('')
  const [date, setDate] = useState(todayInput())
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(() => [...packs].sort((a, b) => b.date.localeCompare(a.date)), [packs])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nQty = Math.floor(Number(qty))
    const nCost = Number(cost)
    const nNews = Math.floor(Number(news || '0'))
    if (!Number.isFinite(nQty) || nQty < 1) return setError('Cantidad de sobres inválida.')
    if (!Number.isFinite(nCost) || nCost < 0) return setError('Costo inválido.')
    if (!Number.isFinite(nNews) || nNews < 0) return setError('Cantidad de nuevas inválida.')

    // Guardamos la fecha elegida con la hora actual para conservar el orden.
    const iso = `${date}T${new Date().toISOString().slice(11)}`
    addPack({
      date: iso,
      packs: nQty,
      cost: nCost,
      newCount: nNews,
      ownedAfter: overall.owned,
    })
    setError(null)
    setQty('1')
    setCost('')
    setNews('')
    setDate(todayInput())
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Sobres</Typography>

      {/* Registrar sobre */}
      <Paper component="form" onSubmit={onSubmit} sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Registrar sobre abierto</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cargá lo que abriste para llevar el gasto y la predicción. Las nuevas son las figuritas que
          aún no tenías.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="Sobres"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            sx={{ width: { xs: '100%', sm: 100 } }}
          />
          <TextField
            label="Costo total"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            placeholder="0"
            sx={{ width: { xs: '100%', sm: 140 } }}
          />
          <TextField
            label="Figus nuevas"
            type="number"
            value={news}
            onChange={(e) => setNews(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            placeholder="0"
            sx={{ width: { xs: '100%', sm: 130 } }}
          />
          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { sm: 'stretch' } }}>
            Registrar
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Resumen */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <SummaryCard
          icon={<Inventory2OutlinedIcon />}
          color="primary.main"
          value={String(summary.totalPacks)}
          label="Sobres comprados"
        />
        <SummaryCard
          icon={<PaidOutlinedIcon />}
          color="secondary.main"
          value={formatMoney(summary.totalCost)}
          label="Gastado total"
        />
        <SummaryCard
          icon={<NewReleasesOutlinedIcon />}
          color="success.main"
          value={summary.costPerNew > 0 ? formatMoney(summary.costPerNew) : '—'}
          label="Costo por figu nueva"
        />
        <SummaryCard
          icon={<AutoGraphOutlinedIcon />}
          color="primary.main"
          value={summary.avgNewPerPack > 0 ? formatDecimal(summary.avgNewPerPack) : '—'}
          label="Nuevas por sobre"
        />
      </Box>

      {/* Predicción */}
      <Paper sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Para completar el álbum</Typography>
        {overall.missing === 0 ? (
          <Alert severity="success">¡Completaste el álbum! 🎉</Alert>
        ) : (
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <PredictStat value={String(overall.missing)} label="Figuritas faltan" />
              <PredictStat value={`~${prediction.packsToFinish}`} label="Sobres faltan (aprox.)" />
              <PredictStat
                value={prediction.costToFinish != null ? `~${formatMoney(prediction.costToFinish)}` : '—'}
                label="Costo estimado"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Estimamos <b>~{prediction.packsToFinish}</b> sobres más para completar el álbum
              {prediction.costToFinish != null && (
                <>
                  {' '}
                  (<b>~{formatMoney(prediction.costToFinish)}</b> a tu gasto promedio)
                </>
              )}
              .
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Modelo del coleccionista (≈7 figus por sobre, al azar). Tiene en cuenta que cuanto más
              lleno está el álbum más repetidas salen, así que el tramo final es el más caro.
              {prediction.avgNewPerPack > 0 && (
                <> Tu ritmo real hasta ahora: {formatDecimal(prediction.avgNewPerPack)} nuevas por sobre.</>
              )}
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* Gráfico de avance */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Avance del álbum</Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
            {overall.percent}%
          </Typography>
        </Box>
        {chartPoints.length >= 2 ? (
          <>
            <MiniAreaChart points={chartPoints} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {fmtDate(timeline[0].date)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hoy
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Registrá sobres en distintos momentos para ver la curva de avance.
          </Typography>
        )}
      </Paper>

      {/* Historial */}
      <Paper sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Historial de sobres</Typography>
        {sorted.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Todavía no registraste ningún sobre.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={1}>
            {sorted.map((p) => (
              <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fmtDate(p.date)} · {p.packs} {p.packs === 1 ? 'sobre' : 'sobres'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatMoney(p.cost)} · {p.newCount} {p.newCount === 1 ? 'nueva' : 'nuevas'}
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${p.newCount} nuevas`} />
                <Tooltip title="Eliminar registro">
                  <IconButton size="small" color="error" onClick={() => removePack(p.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PredictStat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography color="primary" sx={{ fontWeight: 800, fontSize: '1.4rem', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}

function SummaryCard({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode
  color: string
  value: string
  label: string
}) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>{icon}</Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  )
}
