// src/services/profiles.service.ts
import { supabase } from '../lib/supabase'
import { err, ok, type Result } from './_result'
import type { MyProfile } from '../domain/profiles'

export async function isUsernameAvailable(username: string): Promise<Result<boolean>> {
  const u = username.trim().toLowerCase().replace(/\s+/g, '')
  if (!u) return err(new Error('username vacío'))

  const { data, error } = await supabase.rpc('is_username_available', { u })

  if (error) return err(error)
  if (typeof data !== 'boolean') return err(new Error('Respuesta inválida del servidor'))

  return ok(data)
}

export async function getMyProfile(): Promise<Result<MyProfile>> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser()
  if (userErr) return err(userErr)

  const user = userRes.user
  if (!user) return err(new Error('No user session'))

  const { data, error } = await supabase
    .from('my_profile')
    .select('id, username, display_name, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (error) return err(error)
  return ok(data as MyProfile)
}
