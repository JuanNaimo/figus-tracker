import { create } from 'zustand'
import type { PackEvent } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { SyncStatus } from './useCollection'

interface PacksStore {
  packs: PackEvent[]
  status: SyncStatus
  userId: string | null
  /** Carga los sobres del usuario (cache local primero, luego nube). */
  hydrate: (userId: string) => Promise<void>
  /** Limpia el estado al cerrar sesión. */
  clear: () => void
  /** Registra un nuevo evento de sobres (se le asigna id). */
  add: (entry: Omit<PackEvent, 'id'>) => void
  /** Elimina un registro por id. */
  remove: (id: string) => void
  /** Reemplaza todo el historial (import / restaurar backup). */
  replaceAll: (packs: PackEvent[]) => void
}

const cacheKey = (userId: string) => `figus:packs:${userId}`

let saveTimer: ReturnType<typeof setTimeout> | null = null

/** Id estable para un nuevo registro. */
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`
}

export const usePacks = create<PacksStore>((set, get) => {
  function persist(next: PackEvent[]) {
    const { userId } = get()
    set({ packs: next })
    if (!userId) return
    try {
      localStorage.setItem(cacheKey(userId), JSON.stringify(next))
    } catch {
      /* cuota llena: ignorar */
    }
    scheduleCloudSave()
  }

  function scheduleCloudSave() {
    if (!isSupabaseConfigured) return
    set({ status: 'saving' })
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveToCloud, 800)
  }

  async function saveToCloud() {
    const { userId, packs } = get()
    if (!userId) return
    if (!navigator.onLine) {
      set({ status: 'offline' })
      return
    }
    const { error } = await supabase
      .from('collections')
      .upsert({ user_id: userId, packs, updated_at: new Date().toISOString() })
    set({ status: error ? 'error' : 'saved' })
  }

  return {
    packs: [],
    status: 'idle',
    userId: null,

    hydrate: async (userId) => {
      set({ userId, status: 'loading' })

      // 1) cache local para mostrar algo al instante
      let local: PackEvent[] = []
      try {
        const raw = localStorage.getItem(cacheKey(userId))
        if (raw) local = JSON.parse(raw)
      } catch {
        /* cache corrupta: ignorar */
      }
      set({ packs: local })

      // 2) nube como fuente de verdad
      if (!isSupabaseConfigured || !navigator.onLine) {
        set({ status: navigator.onLine ? 'idle' : 'offline' })
        return
      }
      const { data, error } = await supabase
        .from('collections')
        .select('packs')
        .eq('user_id', userId)
        .maybeSingle()

      // Si la columna `packs` aún no existe (migración pendiente), conservamos
      // lo local sin romper la app.
      if (error) {
        set({ status: 'offline' })
        return
      }
      const cloud = (data?.packs as PackEvent[] | undefined) ?? []
      set({ packs: cloud, status: 'saved' })
      try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(cloud))
      } catch {
        /* ignorar */
      }
    },

    clear: () => {
      if (saveTimer) clearTimeout(saveTimer)
      set({ packs: [], userId: null, status: 'idle' })
    },

    add: (entry) => persist([...get().packs, { ...entry, id: newId() }]),

    remove: (id) => persist(get().packs.filter((p) => p.id !== id)),

    replaceAll: (packs) => persist(sanitize(packs)),
  }
})

/** Descarta registros inválidos y normaliza los números. */
function sanitize(input: PackEvent[]): PackEvent[] {
  if (!Array.isArray(input)) return []
  const out: PackEvent[] = []
  for (const p of input) {
    if (!p || typeof p !== 'object') continue
    const packs = Math.max(1, Math.floor(Number(p.packs)) || 0)
    const cost = Math.max(0, Number(p.cost) || 0)
    const newCount = Math.max(0, Math.floor(Number(p.newCount)) || 0)
    const ownedAfter = Math.max(0, Math.floor(Number(p.ownedAfter)) || 0)
    const date = typeof p.date === 'string' ? p.date : new Date().toISOString()
    const id = typeof p.id === 'string' && p.id ? p.id : newId()
    out.push({ id, date, packs, cost, newCount, ownedAfter, note: p.note })
  }
  return out
}
