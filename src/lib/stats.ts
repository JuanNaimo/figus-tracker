import type { CollectionState, Sticker } from '../types'

export interface OverallStats {
  total: number
  owned: number // figuritas distintas que tengo (count >= 1)
  missing: number // me faltan (count === 0)
  duplicates: number // figuritas con repes (count > 1)
  extras: number // total de repes sobrantes (suma de count-1)
  percent: number // % de álbum completado (0-100)
}

export interface TeamStats {
  team: string
  total: number
  owned: number
  missing: number
  extras: number
  percent: number
}

/** Cantidad que el usuario posee de una figurita. */
export function countOf(collection: CollectionState, id: string): number {
  return collection[id] ?? 0
}

/** Estadísticas globales del álbum. */
export function computeOverall(catalog: Sticker[], collection: CollectionState): OverallStats {
  let owned = 0
  let duplicates = 0
  let extras = 0
  for (const s of catalog) {
    const c = countOf(collection, s.id)
    if (c >= 1) owned++
    if (c > 1) {
      duplicates++
      extras += c - 1
    }
  }
  const total = catalog.length
  const missing = total - owned
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100)
  return { total, owned, missing, duplicates, extras, percent }
}

/** Estadísticas por equipo, en el orden en que aparecen en el catálogo. */
export function computeByTeam(catalog: Sticker[], collection: CollectionState): TeamStats[] {
  const map = new Map<string, TeamStats>()
  const order: string[] = []
  for (const s of catalog) {
    if (!map.has(s.team)) {
      map.set(s.team, { team: s.team, total: 0, owned: 0, missing: 0, extras: 0, percent: 0 })
      order.push(s.team)
    }
    const t = map.get(s.team)!
    t.total++
    const c = countOf(collection, s.id)
    if (c >= 1) t.owned++
    if (c > 1) t.extras += c - 1
  }
  for (const t of map.values()) {
    t.missing = t.total - t.owned
    t.percent = t.total === 0 ? 0 : Math.round((t.owned / t.total) * 100)
  }
  return order.map((team) => map.get(team)!)
}
