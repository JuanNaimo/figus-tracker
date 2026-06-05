import { CATALOG } from '../data/catalog2026'
import type { Sticker } from '../types'

/** Mapa id (código impreso, ej. "ARG5") -> figurita. El id es único y estable. */
export const STICKER_BY_ID: Map<string, Sticker> = new Map(CATALOG.map((s) => [s.id, s]))

/** Devuelve la figurita por su código/id, o undefined si no existe. */
export function getStickerById(id: string): Sticker | undefined {
  return STICKER_BY_ID.get(id)
}

/** Prefijo de letras de un código: "ARG5" -> "ARG", "FWC9" -> "FWC", "00" -> "". */
export function prefixOf(id: string): string {
  return (id.match(/^[A-Za-z]+/)?.[0] ?? '').toUpperCase()
}

/** Prefijo (3 letras aprox.) -> nombre del equipo/sección. Derivado del catálogo. */
export const PREFIX_TO_TEAM: Map<string, string> = new Map()
/** Nombre del equipo -> su prefijo de código. */
export const TEAM_TO_PREFIX: Map<string, string> = new Map()

for (const s of CATALOG) {
  const p = prefixOf(s.id)
  if (!p) continue // caso especial "00" (sin prefijo)
  if (!PREFIX_TO_TEAM.has(p)) PREFIX_TO_TEAM.set(p, s.team)
  if (!TEAM_TO_PREFIX.has(s.team)) TEAM_TO_PREFIX.set(s.team, p)
}

/** Conjunto de prefijos válidos del álbum (ARG, BRA, FWC, …). */
export const VALID_PREFIXES: Set<string> = new Set(PREFIX_TO_TEAM.keys())

/** Figuritas de un prefijo dado, ordenadas por número. */
export function stickersByPrefix(prefix: string): Sticker[] {
  return CATALOG.filter((s) => prefixOf(s.id) === prefix).sort((a, b) => a.number - b.number)
}
