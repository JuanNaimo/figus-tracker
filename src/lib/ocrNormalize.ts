import type { Sticker } from '../types'
import { getStickerById, VALID_PREFIXES, prefixOf, stickersByPrefix } from './catalogLookup'

export interface OcrResult {
  /** Figurita reconocida (match exacto), o null si no se pudo identificar. */
  match: Sticker | null
  /** true si hizo falta corregir caracteres confundidos por el OCR. */
  corrected: boolean
  /** Texto normalizado que se intentó interpretar (para mostrar/depurar). */
  cleaned: string
  /** Sugerencias cuando no hay match exacto (para que la UI ofrezca opciones). */
  candidates: Sticker[]
}

// Errores típicos de OCR. En el PREFIJO (deben ser letras) convertimos dígitos a letras;
// en el NÚMERO (deben ser dígitos) convertimos letras a dígitos.
const DIGIT_TO_LETTER: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '4': 'A',
  '5': 'S',
  '6': 'G',
  '8': 'B',
}
const LETTER_TO_DIGIT: Record<string, string> = {
  O: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  A: '4',
  S: '5',
  G: '6',
  T: '7',
  B: '8',
}

/** Convierte un fragmento a solo-letras (corrigiendo dígitos confundidos). */
function toLetters(s: string): string {
  let out = ''
  for (const ch of s) {
    const mapped = /[A-Z]/.test(ch) ? ch : (DIGIT_TO_LETTER[ch] ?? '')
    if (!mapped) return ''
    out += mapped
  }
  return out
}

/** Convierte un fragmento a solo-dígitos (corrigiendo letras confundidas). */
function toDigits(s: string): string {
  let out = ''
  for (const ch of s) {
    const mapped = /[0-9]/.test(ch) ? ch : (LETTER_TO_DIGIT[ch] ?? '')
    if (!mapped) return ''
    out += mapped
  }
  return out
}

/** Cuenta cuántas posiciones cambiaron entre original y convertido. */
function corrections(original: string, converted: string): number {
  let n = 0
  for (let i = 0; i < converted.length; i++) if (original[i] !== converted[i]) n++
  return n
}

/** Distancia de edición acotada (suficiente para corregir prefijos de ~3 letras). */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 2) return 99
  const dp = Array.from({ length: m + 1 }, (_, i) => i)
  for (let j = 1; j <= n; j++) {
    let prev = dp[0]
    dp[0] = j
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i]
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = tmp
    }
  }
  return dp[m]
}

/** Prefijo válido más cercano (distancia ≤1), o null. */
function nearestPrefix(guess: string): string | null {
  if (VALID_PREFIXES.has(guess)) return guess
  let best: string | null = null
  let bestD = 2
  for (const p of VALID_PREFIXES) {
    if (p.length !== guess.length) continue
    const d = levenshtein(guess, p)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

/**
 * Interpreta el texto crudo del OCR (o de la entrada manual) como un código del
 * álbum. Tolera ruido, mayúsculas/minúsculas y confusiones típicas del OCR.
 * Devuelve la figurita si la identifica, o una lista de candidatos cercanos.
 */
export function normalizeCode(raw: string): OcrResult {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const empty: OcrResult = { match: null, corrected: false, cleaned, candidates: [] }
  if (!cleaned) return empty

  // 1) Match exacto sin corregir.
  const exact = getStickerById(cleaned)
  if (exact) return { match: exact, corrected: false, cleaned, candidates: [] }

  // 2) Caso especial "00" (Panini Logo): "O0", "0O", "OO", "0", "O"…
  if (/^[O0]{1,2}$/.test(cleaned)) {
    const s = getStickerById('00')
    if (s) return { match: s, corrected: cleaned !== '00', cleaned, candidates: [] }
  }

  // 3) Probar cada punto de corte: izquierda = prefijo (letras), derecha = número (dígitos).
  let best: { sticker: Sticker; corr: number } | null = null
  const nearMisses: Sticker[] = []
  for (let i = 1; i < cleaned.length; i++) {
    const rawPrefix = cleaned.slice(0, i)
    const rawNum = cleaned.slice(i)
    const prefix = toLetters(rawPrefix)
    const num = toDigits(rawNum)
    if (!prefix || !num) continue
    if (!VALID_PREFIXES.has(prefix)) continue
    const n = parseInt(num, 10)
    if (!Number.isFinite(n)) continue
    const id = `${prefix}${n}`
    const sticker = getStickerById(id)
    const corr = corrections(rawPrefix, prefix) + corrections(rawNum, num)
    if (sticker) {
      // Preferimos el candidato con menos correcciones y prefijo de 3 letras.
      if (!best || corr < best.corr || (corr === best.corr && prefix.length === 3)) {
        best = { sticker, corr }
      }
    } else {
      // Prefijo válido pero número fuera de rango: guardamos vecinos para sugerir.
      for (const cand of stickersByPrefix(prefix)) {
        if (Math.abs(cand.number - n) <= 1) nearMisses.push(cand)
      }
    }
  }
  if (best) return { match: best.sticker, corrected: best.corr > 0, cleaned, candidates: [] }

  // 4) Sin match: ofrecer sugerencias. Probar corregir el prefijo por similitud.
  const guessPrefix = toLetters(cleaned.match(/^[A-Z0-9]*?(?=[0-9]*$)/)?.[0] ?? '')
  const fixed = nearestPrefix(prefixOf(cleaned) || guessPrefix)
  const candidates = dedupe(nearMisses)
  if (candidates.length === 0 && fixed) {
    return { match: null, corrected: false, cleaned, candidates: stickersByPrefix(fixed).slice(0, 6) }
  }
  return { match: null, corrected: false, cleaned, candidates: candidates.slice(0, 6) }
}

function dedupe(list: Sticker[]): Sticker[] {
  const seen = new Set<string>()
  const out: Sticker[] = []
  for (const s of list) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  return out
}
