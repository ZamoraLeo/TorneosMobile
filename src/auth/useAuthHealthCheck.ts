import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { supabase } from '../lib/supabase'

async function ensureAuthStillValid() {
  // Si no hay sesión local, no hay nada que validar
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return

  // Si hay sesión, validamos contra el servidor
  const { data, error } = await supabase.auth.getUser()

  if (!error && data.user) return

  // Importante: evita “desloggear” por fallas de red.
  // Solo limpiamos sesión local si parece un 401/403 (token inválido/usuario inexistente).
  const status = (error as any)?.status
  const shouldForceLogout = status === 401 || status === 403 || !data?.user

  if (shouldForceLogout) {
    await supabase.auth.signOut({ scope: 'local' }) // solo limpia storage local
  }
}

export function useAuthHealthCheck() {
  useEffect(() => {
    // Chequeo al arrancar
    ensureAuthStillValid()

    // Chequeo al volver a foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') ensureAuthStillValid()
    })

    return () => sub.remove()
  }, [])
}
