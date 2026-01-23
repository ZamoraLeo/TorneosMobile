// src/domain/auth.ts
import type { AuthError, Session, User } from '@supabase/supabase-js'
import type { Result } from '../services/_result'

export type SignUpPayload = {
  email: string
  password: string
  fullName: string
  displayName?: string
  username: string
}

export type SignInData = {
  user: User
  session: Session
}

export type SignUpOk = {
  needsEmailConfirmation: boolean
  user: User | null
  session: Session | null
  looksLikeExistingEmail: boolean
}

export type SignUpErrorKind = 'username_taken' | 'username_check_failed' | 'auth'

export type SignUpError = {
  kind: SignUpErrorKind
  error: AuthError
}

export type SignUpResult = Result<SignUpOk, SignUpError>
export type SignInResult = Result<SignInData, AuthError>
