// Grupos del Mundial 2026 (A–L). Las claves usan el nombre de equipo tal como
// figura en el catálogo (en inglés). EDITABLE: si cambia el sorteo, ajustá acá.

export const GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'Congo DR', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

/** Letras de grupo en orden (A..L). */
export const GROUP_LETTERS = Object.keys(GROUPS)

/** Mapa equipo -> letra de grupo. */
export const TEAM_GROUP: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [letter, teams] of Object.entries(GROUPS)) {
    for (const team of teams) map[team] = letter
  }
  return map
})()

/** Devuelve la letra de grupo de un equipo, o null si no está en ningún grupo
 *  (ej. secciones especiales del álbum). */
export function groupOf(team: string): string | null {
  return TEAM_GROUP[team] ?? null
}
