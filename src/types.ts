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

/** Formato del archivo de backup JSON. */
export interface BackupFile {
  version: number
  exportedAt: string
  collection: CollectionState
}
