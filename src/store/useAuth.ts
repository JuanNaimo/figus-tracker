import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { LOCAL_MODE, LOCAL_USER } from '../lib/config'

interface AuthState {
  session: Session | null
  user: User | null
  /** true mientras se resuelve la sesión inicial. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>(() => ({
  session: null,
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? translateAuthError(error.message) : null }
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: translateAuthError(error.message), needsConfirm: false }
    // Si no hay sesión tras el signUp, Supabase está exigiendo confirmar el email.
    const needsConfirm = !data.session
    return { error: null, needsConfirm }
  },

  signOut: async () => {
    if (LOCAL_MODE) return // en modo local no hay sesión real
    await supabase.auth.signOut()
  },
}))

/** Inicializa el listener de sesión. Llamar una vez al arrancar la app. */
export function initAuth() {
  if (LOCAL_MODE) {
    // Modo local: usuario falso, sin Supabase.
    useAuth.setState({ user: LOCAL_USER as unknown as User, loading: false })
    return
  }

  supabase.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, user: data.session?.user ?? null, loading: false })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session, user: session?.user ?? null, loading: false })
  })
}

/** Traduce los mensajes de error más comunes de Supabase al español. */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (m.includes('user already registered')) return 'Ese email ya está registrado. Iniciá sesión.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'El email no es válido.'
  if (m.includes('email not confirmed')) return 'Tenés que confirmar tu email antes de entrar.'
  return msg
}
