// src/lib/supabase.ts
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.secret'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // lock: processLock,
  },
})

/**
 * ⚠️ Evita duplicar el listener por Fast Refresh (DEV)
 */
declare global {
  // eslint-disable-next-line no-var
  var __sb_appstate_listener_added__: boolean | undefined
}

if (Platform.OS !== 'web' && !globalThis.__sb_appstate_listener_added__) {
  globalThis.__sb_appstate_listener_added__ = true

  // ✅ Arranca el refresh desde el inicio
  supabase.auth.startAutoRefresh()

  // ✅ Mantiene refresh solo cuando está activa
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
