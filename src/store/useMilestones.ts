import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { SyncStatus } from './useCollection'

/** Hito de completado: nombre del país -> fecha ISO en que se completó por
 *  primera vez. Es un registro histórico: nunca se borra aunque después
 *  cambies/entregues figuritas de ese país. */
export type Milestones = Record<string, string>

interface MilestonesStore {
  completions: Milestones
  status: SyncStatus
  userId: string | null
  /** Carga los hitos del usuario (cache local primero, luego nube). */
  hydrate: (userId: string) => Promise<void>
  /** Limpia el estado al cerrar sesión. */
  clear: () => void
  /** Registra como completados los países dados que aún no tuvieran fecha. */
  record: (teams: string[]) => void
}

const cacheKey = (userId: string) => `figus:milestones:${userId}`

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useMilestones = create<MilestonesStore>((set, get) => {
  function persist(next: Milestones) {
    const { userId } = get()
    set({ completions: next })
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
    const { userId, completions } = get()
    if (!userId) return
    if (!navigator.onLine) {
      set({ status: 'offline' })
      return
    }
    const { error } = await supabase
      .from('collections')
      .upsert({ user_id: userId, milestones: completions, updated_at: new Date().toISOString() })
    set({ status: error ? 'error' : 'saved' })
  }

  return {
    completions: {},
    status: 'idle',
    userId: null,

    hydrate: async (userId) => {
      set({ userId, status: 'loading' })

      // 1) cache local para mostrar algo al instante
      let local: Milestones = {}
      try {
        const raw = localStorage.getItem(cacheKey(userId))
        if (raw) local = JSON.parse(raw)
      } catch {
        /* cache corrupta: ignorar */
      }
      set({ completions: local })

      // 2) nube como fuente de verdad
      if (!isSupabaseConfigured || !navigator.onLine) {
        set({ status: navigator.onLine ? 'idle' : 'offline' })
        return
      }
      const { data, error } = await supabase
        .from('collections')
        .select('milestones')
        .eq('user_id', userId)
        .maybeSingle()

      // Si la columna `milestones` aún no existe (migración pendiente),
      // conservamos lo local sin romper la app.
      if (error) {
        set({ status: 'offline' })
        return
      }
      const cloud = (data?.milestones as Milestones | undefined) ?? {}
      // Fusionamos con lo local conservando la fecha más antigua de cada país.
      const merged: Milestones = { ...cloud }
      for (const [team, date] of Object.entries(local)) {
        if (!merged[team] || date < merged[team]) merged[team] = date
      }
      set({ completions: merged, status: 'saved' })
      try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(merged))
      } catch {
        /* ignorar */
      }
    },

    clear: () => {
      if (saveTimer) clearTimeout(saveTimer)
      set({ completions: {}, userId: null, status: 'idle' })
    },

    record: (teams) => {
      const cur = get().completions
      const now = new Date().toISOString()
      let changed = false
      const next: Milestones = { ...cur }
      for (const team of teams) {
        if (!next[team]) {
          next[team] = now
          changed = true
        }
      }
      if (changed) persist(next)
    },
  }
})
