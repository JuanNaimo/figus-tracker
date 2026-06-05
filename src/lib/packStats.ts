import type { PackEvent } from '../types'

export interface PackSummary {
  /** Cantidad de registros cargados. */
  entries: number
  /** Total de sobres comprados (suma de `packs`). */
  totalPacks: number
  /** Total gastado. */
  totalCost: number
  /** Total de figuritas nuevas obtenidas. */
  totalNew: number
  /** Costo promedio por sobre (totalCost / totalPacks). */
  avgCostPerPack: number
  /** Figuritas nuevas promedio por sobre (totalNew / totalPacks). */
  avgNewPerPack: number
  /** Costo promedio por figurita nueva (totalCost / totalNew). */
  costPerNew: number
}

/** Resume el historial de sobres en métricas agregadas. */
export function summarizePacks(packs: PackEvent[]): PackSummary {
  let totalPacks = 0
  let totalCost = 0
  let totalNew = 0
  for (const p of packs) {
    totalPacks += p.packs
    totalCost += p.cost
    totalNew += p.newCount
  }
  return {
    entries: packs.length,
    totalPacks,
    totalCost,
    totalNew,
    avgCostPerPack: totalPacks > 0 ? totalCost / totalPacks : 0,
    avgNewPerPack: totalPacks > 0 ? totalNew / totalPacks : 0,
    costPerNew: totalNew > 0 ? totalCost / totalNew : 0,
  }
}

export interface TimelinePoint {
  /** Fecha ISO del punto. */
  date: string
  /** Figuritas distintas que tenía en ese momento. */
  owned: number
  /** % del álbum completado en ese momento (0-100). */
  percent: number
}

/** Construye la serie de avance del álbum a partir de los snapshots `ownedAfter`
 *  de cada registro, ordenados por fecha. Agrega el estado actual como último
 *  punto para que el gráfico refleje siempre la realidad. */
export function buildTimeline(
  packs: PackEvent[],
  currentOwned: number,
  total: number,
  nowIso: string,
): TimelinePoint[] {
  const pct = (owned: number) => (total > 0 ? Math.round((owned / total) * 100) : 0)
  const sorted = [...packs].sort((a, b) => a.date.localeCompare(b.date))
  const points: TimelinePoint[] = sorted.map((p) => ({
    date: p.date,
    owned: p.ownedAfter,
    percent: pct(p.ownedAfter),
  }))
  const last = points[points.length - 1]
  if (!last || last.owned !== currentOwned) {
    points.push({ date: nowIso, owned: currentOwned, percent: pct(currentOwned) })
  }
  return points
}

/** Figuritas por sobre del álbum Panini (sobres estándar = 7). Se usa para el
 *  modelo estadístico de la predicción. */
export const DEFAULT_PACK_SIZE = 7

/** Sobres esperados para pasar de `owned` a `total`, asumiendo que cada figurita
 *  del sobre es uniforme y al azar (modelo simple del coleccionista). Refleja los
 *  rendimientos decrecientes: cuanto más lleno el álbum, más repetidas salen y más
 *  cuesta cada figurita nueva. */
export function expectedPacksToComplete(
  owned: number,
  total: number,
  packSize = DEFAULT_PACK_SIZE,
): number {
  if (total <= 0 || owned >= total) return 0
  if (packSize <= 0) return Infinity
  let o = owned
  let packs = 0
  const CAP = 1_000_000 // cota de seguridad para la última figurita (cola larga)
  while (total - o > 1e-3 && packs < CAP) {
    const pNew = (total - o) / total // prob. de que una figurita del sobre sea nueva
    o += packSize * pNew
    packs++
  }
  return packs
}

export interface Prediction {
  /** Figuritas que faltan para completar el álbum. */
  missing: number
  /** Nuevas promedio por sobre del historial del usuario (0 si no hay datos). */
  avgNewPerPack: number
  /** Sobres estimados para completar (modelo estadístico; siempre disponible). */
  packsToFinish: number
  /** Costo estimado para completar (null si todavía no hay gasto registrado). */
  costToFinish: number | null
}

/** Predice cuántos sobres (y cuánto dinero) faltan para completar el álbum.
 *  Los sobres se estiman con el modelo del coleccionista (no requiere historial);
 *  el costo usa el gasto promedio real del usuario cuando ya cargó sobres. */
export function predict(
  summary: PackSummary,
  owned: number,
  total: number,
  packSize = DEFAULT_PACK_SIZE,
): Prediction {
  const missing = Math.max(0, total - owned)
  const packsToFinish = Math.round(expectedPacksToComplete(owned, total, packSize))
  const costToFinish =
    summary.avgCostPerPack > 0 ? Math.round(packsToFinish * summary.avgCostPerPack) : null
  return {
    missing,
    avgNewPerPack: summary.avgNewPerPack,
    packsToFinish,
    costToFinish,
  }
}

const moneyFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const decimalFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

/** Formatea un monto como "$ 1.234". */
export function formatMoney(value: number): string {
  return `$ ${moneyFmt.format(Math.round(value))}`
}

/** Formatea un número con como máximo un decimal. */
export function formatDecimal(value: number): string {
  return decimalFmt.format(value)
}
