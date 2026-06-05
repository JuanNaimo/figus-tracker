import { useTheme } from '@mui/material'

export interface ChartPoint {
  label: string
  /** Valor en porcentaje 0-100. */
  value: number
}

/** Gráfico de área/linea simple en SVG, sin dependencias externas.
 *  Escala el eje Y de 0 a 100 (porcentaje del álbum). */
export default function MiniAreaChart({ points, height = 160 }: { points: ChartPoint[]; height?: number }) {
  const theme = useTheme()
  const W = 100 // viewBox en unidades; el SVG se estira al 100% del ancho
  const H = 100
  const pad = 6

  if (points.length === 0) return null

  const n = points.length
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i / (n - 1)) * (W - pad * 2))
  const y = (v: number) => H - pad - (Math.max(0, Math.min(100, v)) / 100) * (H - pad * 2)

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const area = `${pad},${H - pad} ${line} ${x(n - 1)},${H - pad}`
  const last = points[n - 1]
  const primary = theme.palette.primary.main

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
      role="img"
      aria-label={`Avance del álbum, actual ${last.value}%`}
    >
      <defs>
        <linearGradient id="figus-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
          <stop offset="100%" stopColor={primary} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* líneas guía a 25/50/75/100% */}
      {[0, 25, 50, 75, 100].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={W - pad}
          y1={y(g)}
          y2={y(g)}
          stroke={theme.palette.divider}
          strokeWidth={0.3}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <polygon points={area} fill="url(#figus-area)" />
      <polyline
        points={line}
        fill="none"
        stroke={primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* punto final */}
      <circle cx={x(n - 1)} cy={y(last.value)} r={1.8} fill={primary} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
