import { create } from 'zustand'
import type { CollectionState } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'offline' | 'error'

interface CollectionStore {
  collection: CollectionState
  status: SyncStatus
  userId: string | null
  /** Carga la colección del usuario (cache local primero, luego nube). */
  hydrate: (userId: string) => Promise<void>
  /** Limpia el estado al cerrar sesión. */
  clear: () => void
  /** +1 a una figurita. */
  increment: (id: string) => void
  /** -1 a una figurita (mínimo 0). */
  decrement: (id: string) => void
  /** Fija una cantidad exacta (>=0). */
  setCount: (id: string, count: number) => void
  /** Reemplaza toda la colección (import "reemplazar"). */
  replaceAll: (collection: CollectionState) => void
  /** Mezcla con la colección actual sumando cantidades (import "fusionar"). */
  mergeAll: (collection: CollectionState) => void
  /** Vacía la colección (todo a 0). */
  reset: () => void
}

const cacheKey = (userId: string) => `figus:collection:${userId}`

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useCollection = create<CollectionStore>((set, get) => {
  /** Persiste en cache local (instantáneo) y agenda guardado en la nube. */
  function persist(next: CollectionState) {
    const { userId } = get()
    set({ collection: next })
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
    const { userId, collection } = get()
    if (!userId) return
    if (!navigator.onLine) {
      set({ status: 'offline' })
      return
    }
    const { error } = await supabase
      .from('collections')
      .upsert({ user_id: userId, data: collection, updated_at: new Date().toISOString() })
    set({ status: error ? 'error' : 'saved' })
  }

  return {
    collection: {},
    status: 'idle',
    userId: null,

    hydrate: async (userId) => {
      set({ userId, status: 'loading' })

      // 1) cache local para mostrar algo al instante
      let local: CollectionState = {}
      try {
        const raw = localStorage.getItem(cacheKey(userId))
        if (raw) local = JSON.parse(raw)
      } catch {
        /* cache corrupta: ignorar */
      }
      set({ collection: local })

      // 2) nube como fuente de verdad
      if (!isSupabaseConfigured || !navigator.onLine) {
        set({ status: navigator.onLine ? 'idle' : 'offline' })
        return
      }
      const { data, error } = await supabase
        .from('collections')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        set({ status: 'offline' })
        return
      }
      const cloud = (data?.data as CollectionState | undefined) ?? {}
      set({ collection: cloud, status: 'saved' })
      try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(cloud))
      } catch {
        /* ignorar */
      }
    },

    clear: () => {
      if (saveTimer) clearTimeout(saveTimer)
      set({ collection: {}, userId: null, status: 'idle' })
    },

    increment: (id) => {
      const cur = get().collection[id] ?? 0
      persist({ ...get().collection, [id]: cur + 1 })
    },

    decrement: (id) => {
      const cur = get().collection[id] ?? 0
      const next = { ...get().collection }
      if (cur <= 1) delete next[id]
      else next[id] = cur - 1
      persist(next)
    },

    setCount: (id, count) => {
      const next = { ...get().collection }
      if (count <= 0) delete next[id]
      else next[id] = count
      persist(next)
    },

    replaceAll: (collection) => persist(sanitize(collection)),

    mergeAll: (collection) => {
      const merged: CollectionState = { ...get().collection }
      for (const [id, count] of Object.entries(sanitize(collection))) {
        merged[id] = (merged[id] ?? 0) + count
      }
      persist(merged)
    },

    reset: () => persist({}),
  }
})

/** Filtra valores inválidos y descarta ceros. */
function sanitize(input: CollectionState): CollectionState {
  const out: CollectionState = {}
  for (const [id, raw] of Object.entries(input)) {
    const n = Math.floor(Number(raw))
    if (Number.isFinite(n) && n > 0) out[id] = n
  }
  return out
}
