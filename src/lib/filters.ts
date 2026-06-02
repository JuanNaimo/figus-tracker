import type { CollectionState, Sticker } from '../types'
import { countOf } from './stats'

export type StatusFilter = 'all' | 'missing' | 'owned' | 'duplicates'

export interface FilterOptions {
  query: string
  status: StatusFilter
  team: string | 'all'
}

/** Aplica búsqueda de texto + filtro de estado + filtro de equipo. */
export function filterStickers(
  catalog: Sticker[],
  collection: CollectionState,
  { query, status, team }: FilterOptions,
): Sticker[] {
  const q = query.trim().toLowerCase()
  return catalog.filter((s) => {
    if (team !== 'all' && s.team !== team) return false

    const c = countOf(collection, s.id)
    if (status === 'missing' && c !== 0) return false
    if (status === 'owned' && c < 1) return false
    if (status === 'duplicates' && c <= 1) return false

    if (q) {
      const haystack = `${s.number} ${s.team} ${s.label ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
