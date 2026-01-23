// src/auth/useAuthHealthCheck.ts
import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { supabase } from '../lib/supabase'

export function useAuthHealthCheck(accessToken: string | null, enabled: boolean) {
  const inFlight = useRef(false)
  const lastRunAt = useRef(0)
  const tokenRef = useRef<string | null>(accessToken)

  useEffect(() => {
    tokenRef.current = accessToken
  }, [accessToken])

  const run = useCallback(async () => {
    if (!enabled) return
    const token = tokenRef.current
    if (!token) return

    if (inFlight.current) return

    const now = Date.now()
    if (now - lastRunAt.current < 15_000) return // throttle

    inFlight.current = true
    try {
      // ✅ NO storage, NO lock: usamos token directo
      const { data, error } = await supabase.auth.getUser(token)

      if (!error && data.user) return

      const status = (error as any)?.status
      const shouldForceLogout = status === 401 || status === 403 || !data?.user

      if (shouldForceLogout) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } finally {
      lastRunAt.current = Date.now()
      inFlight.current = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    // ✅ Opcional: puedes validarlo al arrancar sin locks
    run()

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') run()
    })

    return () => sub.remove()
  }, [enabled, run])
}
