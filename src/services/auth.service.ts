import { supabase } from '../lib/supabase'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { isUsernameAvailable } from './profiles.service'

export type SignUpPayload = {
  email: string
  password: string
  fullName: string
  displayName?: string
  username: string
}

export type SignUpResult =
  | {
      ok: true
      // Caso típico: confirmación email -> no session
      needsEmailConfirmation: boolean
      user: User | null
      session: Session | null
      looksLikeExistingEmail: boolean
    }
  | {
      ok: false
      error: AuthError
      // señales útiles para UI
      usernameTaken?: boolean
      usernameCheckFailed?: boolean
    }

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

/**
 * Sign up con:
 * 1) check username (RPC)
 * 2) signUp con metadata (options.data)
 * 3) detecta "email ya existe" (identities.length === 0)
 */
export async function signUpWithProfile(payload: SignUpPayload): Promise<SignUpResult> {
  const email = payload.email.trim()
  const password = payload.password
  const fullName = payload.fullName.trim()
  const displayName = (payload.displayName?.trim() || fullName)
  const username = payload.username.trim().toLowerCase()

  // 1) username availability
  const { available, error: userCheckError } = await isUsernameAvailable(username)

  if (available === false) {
    // username ocupado
    // devolvemos ok:false con flags para que UI muestre el mensaje correcto
    // (sin humanizar global todavía)
    return {
      ok: false,
      // fabricamos un AuthError “dummy” para mantener tipo uniforme
      // (la UI igual usará los flags)
      error: { name: 'AuthApiError', status: 400, message: 'username_taken' } as AuthError,
      usernameTaken: true,
    }
  }

  if (available === null) {
    return {
      ok: false,
      error: { name: 'AuthApiError', status: 500, message: userCheckError || 'username_check_failed' } as AuthError,
      usernameCheckFailed: true,
    }
  }

  // 2) signUp
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: displayName,
        username,
      },
    },
  })

  if (error) {
    return { ok: false, error }
  }

  // 3) detectar email existente (caso “silencioso” de Supabase)
  const identities = data.user?.identities ?? []
  const looksLikeExistingEmail = !!data.user && identities.length === 0

  const needsEmailConfirmation = !data.session

  return {
    ok: true,
    needsEmailConfirmation,
    user: data.user ?? null,
    session: data.session ?? null,
    looksLikeExistingEmail,
  }
}