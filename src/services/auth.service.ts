// src/services/auth.service.ts
import { supabase } from '../lib/supabase'
import type { AuthError } from '@supabase/supabase-js'
import { err, ok, type Result } from './_result'
import { isUsernameAvailable } from './profiles.service'
import type { SignInData, SignUpError, SignUpOk, SignUpPayload } from '../domain/auth'

function authApiError(message: string, status = 400) {
  return { name: 'AuthApiError', status, message } as AuthError
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<Result<SignInData, AuthError>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) return err(error)
  if (!data.user || !data.session) return err(authApiError('no_session', 500))

  return ok({ user: data.user, session: data.session })
}

export async function signOut(): Promise<Result<null, AuthError>> {
  const { error } = await supabase.auth.signOut()
  if (error) return err(error)
  return ok(null)
}

export async function signUpWithProfile(
  payload: SignUpPayload
): Promise<Result<SignUpOk, SignUpError>> {
  const email = payload.email.trim()
  const password = payload.password
  const fullName = payload.fullName.trim()
  const displayName = payload.displayName?.trim() || fullName
  const username = payload.username.trim().toLowerCase()

  const chk = await isUsernameAvailable(username)

  if (!chk.ok) {
    return err({
      kind: 'username_check_failed',
      error: authApiError(chk.error?.message || 'username_check_failed', 500),
    })
  }

  if (chk.data === false) {
    return err({
      kind: 'username_taken',
      error: authApiError('username_taken', 400),
    })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, display_name: displayName, username },
    },
  })

  if (error) return err({ kind: 'auth', error })

  const identities = data.user?.identities ?? []
  const looksLikeExistingEmail = !!data.user && identities.length === 0
  const needsEmailConfirmation = !data.session

  return ok({
    needsEmailConfirmation,
    user: data.user ?? null,
    session: data.session ?? null,
    looksLikeExistingEmail,
  })
}
