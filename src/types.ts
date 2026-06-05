// Tipos centrales de la app.

export type StickerType = 'player' | 'badge' | 'special'

/** Una figurita del álbum (parte del catálogo estático). */
export interface Sticker {
  /** Identificador estable, ej. "ARG-3" o "SP-1". */
  id: string
  /** Número impreso en la figurita. */
  number: number
  /** Equipo/selección o sección especial. */
  team: string
  type: StickerType
  /** Nombre del jugador o descripción; editable, puede ser placeholder. */
  label?: string
}

/** Estado del usuario: id de figurita -> cantidad que posee.
 *  0 (o ausente) = falta, 1 = tengo, >1 = repetida. */
export type CollectionState = Record<string, number>

/** Registro de uno o varios sobres abiertos en un mismo momento.
 *  Bookkeeping independiente de la colección: permite calcular costo por
 *  figurita nueva, avance en el tiempo y predicción de sobres restantes. */
export interface PackEvent {
  /** Identificador único del registro. */
  id: string
  /** Fecha del registro en ISO (incluye hora para ordenar). */
  date: string
  /** Cantidad de sobres incluidos en este registro (>= 1). */
  packs: number
  /** Costo total pagado por esos sobres (moneda local). */
  cost: number
  /** Figuritas nuevas (no repetidas) que dieron esos sobres. */
  newCount: number
  /** Snapshot: figuritas distintas que tenía justo después de registrar. */
  ownedAfter: number
  /** Nota opcional. */
  note?: string
}

/** Formato del archivo de backup JSON. */
export interface BackupFile {
  version: number
  exportedAt: string
  collection: CollectionState
  /** Historial de sobres (opcional para compatibilidad con backups viejos). */
  packs?: PackEvent[]
}
