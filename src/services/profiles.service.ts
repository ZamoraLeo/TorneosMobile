import { supabase } from '../lib/supabase'

export async function isUsernameAvailable(username: string): Promise<{
  available: boolean | null
  error?: string
}> {
  const u = username.trim().toLowerCase().replace(/\s+/g, '')
  if (!u) return { available: null, error: 'username vacío' }

  const { data, error } = await supabase.rpc('is_username_available', { u })

  if (error) return { available: null, error: error.message }

  if (typeof data !== 'boolean') return { available: null, error: 'Respuesta inválida del servidor' }

  return { available: data }
}
