import type { Sticker, StickerType } from '../types'
import rawCatalog from './panini-wc-2026-catalog.json'

// Catálogo REAL del álbum Panini FIFA World Cup 2026 (Standard Edition).
// Fuente: laststicker.com (1034 stickers). El JSON trae { code, name, team };
// acá lo transformamos al modelo de la app.

interface RawSticker {
  code: string
  name: string
  team: string
}

/** Secciones del álbum que NO son selecciones nacionales. Se agrupan todas
 *  bajo "Especiales" y se numeran del 0 al 19 (00 + FWC1..FWC19). */
const SPECIAL_GROUPS = new Set<string>([
  'We Are Panini',
  'FIFA World Cup 2026',
  'Host Countries and Cities',
  'FIFA World Cup History',
])

/** Nombre de la sección unificada de especiales. */
export const SPECIAL_SECTION = 'Especiales'

/** Variantes foil/brillantes (códigos terminados en dígitos + "s", ej. GER2s).
 *  Las excluimos: son paralelas a la figurita base. */
const FOIL_CODE = /\d+s$/

/** Número de una figurita especial a partir de su código: "00" -> 0, "FWC9" -> 9. */
function specialNumber(code: string): number {
  const m = code.match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

function buildCatalog(): Sticker[] {
  // Selecciones: numeración 1..N reiniciada por equipo (coincide con el número
  // impreso, ej. ARG1, ARG2…). Especiales: van del 0 al 19 según su código.
  const perTeamCounter = new Map<string, number>()
  return (rawCatalog.stickers as RawSticker[])
    .filter((raw) => !FOIL_CODE.test(raw.code))
    .map((raw) => {
      if (SPECIAL_GROUPS.has(raw.team)) {
        return {
          id: raw.code,
          number: specialNumber(raw.code),
          team: SPECIAL_SECTION,
          type: 'special' as StickerType,
          label: raw.name,
        }
      }
      const n = (perTeamCounter.get(raw.team) ?? 0) + 1
      perTeamCounter.set(raw.team, n)
      return {
        id: raw.code, // código real, único y estable (clave de backup JSON)
        number: n,
        team: raw.team,
        type: raw.name === 'Emblem' ? ('badge' as StickerType) : ('player' as StickerType),
        label: raw.name,
      }
    })
}

/** Catálogo completo del álbum. */
export const CATALOG: Sticker[] = buildCatalog()

/** Equipos/secciones en el orden en que aparecen en el álbum. */
export const TEAMS_IN_ORDER: string[] = (() => {
  const seen = new Set<string>()
  const order: string[] = []
  for (const s of CATALOG) {
    if (!seen.has(s.team)) {
      seen.add(s.team)
      order.push(s.team)
    }
  }
  return order
})()

/** Total de figuritas del álbum. */
export const TOTAL_STICKERS = CATALOG.length
