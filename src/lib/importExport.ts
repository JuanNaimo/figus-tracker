import type { BackupFile, CollectionState, PackEvent, Sticker } from '../types'

const BACKUP_VERSION = 1

// ---------- JSON ----------

/** Serializa la colección (y opcionalmente el historial de sobres) a un backup JSON. */
export function toJsonBackup(collection: CollectionState, now: string, packs?: PackEvent[]): string {
  const file: BackupFile = { version: BACKUP_VERSION, exportedAt: now, collection }
  if (packs && packs.length) file.packs = packs
  return JSON.stringify(file, null, 2)
}

/** Extrae el historial de sobres de un backup JSON (vacío si no tiene o es inválido). */
export function parseBackupPacks(text: string): PackEvent[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  const packs = (parsed as Partial<BackupFile> | null)?.packs
  return Array.isArray(packs) ? (packs as PackEvent[]) : []
}

/** Parsea un backup JSON y devuelve la colección. Lanza si es inválido. */
export function parseJsonBackup(text: string): CollectionState {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  const obj = parsed as Partial<BackupFile> & { collection?: unknown }
  const col = obj && typeof obj === 'object' ? obj.collection : undefined
  if (!col || typeof col !== 'object') {
    throw new Error('El archivo no tiene una colección válida.')
  }
  return normalizeCounts(col as Record<string, unknown>)
}

// ---------- CSV ----------

/** Exporta la colección como CSV: numero,equipo,label,cantidad. */
export function toCsv(catalog: Sticker[], collection: CollectionState): string {
  const rows = [['numero', 'equipo', 'label', 'cantidad']]
  for (const s of catalog) {
    rows.push([
      String(s.number),
      s.team,
      s.label ?? '',
      String(collection[s.id] ?? 0),
    ])
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

/** Parsea un CSV (numero,...,cantidad) y mapea por `numero` al catálogo. */
export function parseCsv(text: string, catalog: Sticker[]): CollectionState {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) throw new Error('El CSV está vacío.')

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const numIdx = header.indexOf('numero')
  const teamIdx = header.indexOf('equipo')
  const qtyIdx = header.indexOf('cantidad')
  if (numIdx === -1 || teamIdx === -1 || qtyIdx === -1) {
    throw new Error('El CSV debe tener columnas "numero", "equipo" y "cantidad".')
  }

  // El número se repite entre países (van del 1 al 20), así que mapeamos por equipo + número.
  const key = (team: string, number: number) => `${team.trim()}#${number}`
  const byKey = new Map<string, string>()
  for (const s of catalog) byKey.set(key(s.team, s.number), s.id)

  const out: CollectionState = {}
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const number = Number(cells[numIdx])
    const qty = Math.floor(Number(cells[qtyIdx]))
    const id = byKey.get(key(cells[teamIdx] ?? '', number))
    if (id && Number.isFinite(qty) && qty > 0) out[id] = qty
  }
  return out
}

// ---------- helpers ----------

function normalizeCounts(raw: Record<string, unknown>): CollectionState {
  const out: CollectionState = {}
  for (const [id, v] of Object.entries(raw)) {
    const n = Math.floor(Number(v))
    if (Number.isFinite(n) && n > 0) out[id] = n
  }
  return out
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

/** Dispara la descarga de un archivo de texto en el navegador. */
export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
