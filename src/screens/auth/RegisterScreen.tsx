import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { AuthError } from '@supabase/supabase-js'

import { useTheme, useThemeMode } from '../../theme/theme'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast'
import { getErrorMessage, logError } from '../../utils/logger'
import { signUpWithProfile } from '../../services/auth.service'
import { isUsernameAvailable } from '../../services/profiles.service'

export async function humanizeSignUpError(
  error: AuthError,
  usernameNorm?: string
): Promise<string> {
  if (error.message === 'Database error saving new user') {
    if (usernameNorm) {
      const res = await isUsernameAvailable(usernameNorm)
      if (res.available === false) return 'Ese username ya está en uso. Prueba otro.'
    }
    return 'No se pudo crear tu perfil. Revisa tu username e intenta de nuevo.'
  }

  if (/already registered/i.test(error.message)) return 'Ese email ya está registrado. Inicia sesión.'
  return error.message
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const USERNAME_RE = /^[a-z0-9]+([._][a-z0-9]+)*$/

function normalizeUsername(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, '')
}

function titleCaseWords(input: string) {
  const s = input.trim().replace(/\s+/g, ' ')
  if (!s) return s
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function suggestUsernameFromFullName(fullName: string) {
  const base = fullName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')

  return base
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function BubblesBackground() {
  const t = useTheme()
  const bubblePrimary = hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.10)
  const bubbleSecondary = t.isDark
    ? 'rgba(56, 189, 248, 0.10)'
    : 'rgba(59, 130, 246, 0.08)'

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 260, backgroundColor: bubblePrimary, top: -90, right: -110 }} />
      <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 170, backgroundColor: bubbleSecondary, top: 210, left: -80 }} />
      <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 120, backgroundColor: bubblePrimary, bottom: 90, right: -45 }} />
      <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 70, backgroundColor: bubbleSecondary, bottom: -20, left: 30 }} />
    </View>
  )
}

function Logo() {
  const t = useTheme()
  return (
    <Text style={{ fontSize: 34, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' }}>
      <Text style={{ color: t.colors.text }}>Bracket</Text>
      <Text style={{ color: t.colors.primary }}>Flow</Text>
    </Text>
  )
}

type Props = { navigation: any }
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
type InputStatus = 'idle' | 'loading' | 'success' | 'error'

export function RegisterScreen({ navigation }: Props) {
  const t = useTheme()
  const toast = useToast()
  const { setMode } = useThemeMode()
  const insets = useSafeAreaInsets()

  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameTouched, setUsernameTouched] = useState(false)

  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameHint, setUsernameHint] = useState<string | null>(null)

  const emailTrim = email.trim()
  const fullNameTrim = fullName.trim()
  const displayNameTrim = displayName.trim()
  const usernameNorm = normalizeUsername(username)

  useEffect(() => {
    if (usernameTouched) return
    const suggested = suggestUsernameFromFullName(fullNameTrim)
    setUsername(suggested)
  }, [fullNameTrim, usernameTouched])

  const checkUsername = useCallback(async (u: string) => {
    setUsernameStatus('checking')
    setUsernameHint('Revisando disponibilidad...')
  
    const res = await isUsernameAvailable(u)
  
    if (res.available === null) {
      logError('Register.username_available', res.error ?? 'unknown')
      setUsernameStatus('error')
      setUsernameHint('No se pudo verificar. Intenta de nuevo.')
      return null
    }
  
    if (res.available === false) {
      setUsernameStatus('taken')
      setUsernameHint('Usuario no disponible.')
      return false
    }
  
    setUsernameStatus('available')
    setUsernameHint('Disponible ✅')
    return true
  }, [])  

  // Debounce check
  useEffect(() => {
    if (busy) return

    if (!usernameNorm) {
      setUsernameStatus('idle')
      setUsernameHint(null)
      return
    }

    if (usernameNorm.length < 3) {
      setUsernameStatus('idle')
      setUsernameHint('Mínimo 3 caracteres.')
      return
    }

    if (!USERNAME_RE.test(usernameNorm)) {
      setUsernameStatus('idle')
      setUsernameHint('Usa letras/números y separadores "." o "_"')
      return
    }

    let cancelled = false
    const id = setTimeout(() => {
      ;(async () => {
        await checkUsername(usernameNorm)
        if (cancelled) return
      })()
    }, 450)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [usernameNorm, busy, checkUsername])

  const usernameInputStatus: InputStatus = useMemo(() => {
    if (!usernameNorm) return 'idle'
    if (usernameStatus === 'checking') return 'loading'
    if (usernameStatus === 'available') return 'success'
    if (usernameStatus === 'taken' || usernameStatus === 'error') return 'error'
    return 'idle'
  }, [usernameNorm, usernameStatus])

  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!fullNameTrim) return false
    if (!emailTrim || !isValidEmail(emailTrim)) return false
    if (!password || password.length < 6) return false

    if (!usernameNorm) return false
    if (!USERNAME_RE.test(usernameNorm)) return false
    if (usernameStatus !== 'available') return false

    return true
  }, [busy, fullNameTrim, emailTrim, password, usernameNorm, usernameStatus])

  const validate = () => {
    if (!fullNameTrim) return 'Escribe tu nombre.'
    if (!usernameNorm) return 'El username es obligatorio.'
    if (usernameNorm.length < 3) return 'El username debe tener al menos 3 caracteres.'
    if (!USERNAME_RE.test(usernameNorm)) return 'Username inválido (usa letras/números y "." o "_").'
    if (!emailTrim) return 'Escribe tu email.'
    if (!isValidEmail(emailTrim)) return 'El email no parece válido.'
    if (!password) return 'Escribe tu contraseña.'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  const toggleTheme = () => setMode(t.isDark ? 'light' : 'dark')

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { email: emailTrim } }],
    })
  }

  const signUp = async () => {
    const msg = validate()
    setFormError(msg)
    if (msg) return
  
    setBusy(true)
    try {
      const res = await signUpWithProfile({
        email: emailTrim,
        password,
        fullName: fullNameTrim,
        displayName: displayNameTrim || fullNameTrim,
        username: usernameNorm,
      })
  
      if (!res.ok) {
        if (res.usernameTaken) {
          const m = 'Ese username ya está en uso. Prueba otro.'
          setFormError(m)
          toast.error('Username ocupado', m)
          return
        }
  
        if (res.usernameCheckFailed) {
          const m = 'No pudimos verificar el username. Intenta de nuevo.'
          setFormError(m)
          toast.error('Error', m)
          return
        }
  
        // fallback por ahora (luego lo mandamos a errors.ts)
        const nice = await humanizeSignUpError(res.error, usernameNorm)
        setFormError(nice)
        toast.error('No se pudo crear la cuenta', nice)
        return
      }
  
      if (res.looksLikeExistingEmail) {
        toast.info(
          'Revisa tu correo',
          'Si el email es nuevo, te llegará un correo de confirmación. Si ya tienes cuenta, inicia sesión.'
        )
        return
      }
  
      toast.success('Cuenta creada', 'Revisa tu correo para confirmar y luego inicia sesión.')
      goToLogin()
    } catch (e) {
      logError('Register.signUp.exception', e)
      const message = getErrorMessage(e)
      setFormError(message)
      toast.error('Error', message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <BubblesBackground />

      <Pressable
        onPress={toggleTheme}
        hitSlop={10}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 14,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: hexToRgba(t.colors.border, 0.8),
          backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          zIndex: 10,
        }}
      >
        <Text style={{ color: t.colors.text, fontWeight: '800' }}>{t.isDark ? '☀️' : '🌙'}</Text>
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'center', padding: t.space.lg }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
              backgroundColor: t.colors.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 18,
              padding: t.space.lg,
              gap: t.space.md,
              shadowOpacity: 0.12,
              shadowRadius: 18,
              elevation: 2,
            }}
          >
            <View style={{ alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Logo />
              <Text style={{ color: t.colors.muted, textAlign: 'center' }}>
                Crea tu cuenta en menos de un minuto.
              </Text>
            </View>

            <View style={{ gap: t.space.sm }}>
              <Input
                placeholder="Nombre (real)"
                value={fullName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                onChangeText={(v) => { setFullName(v); setFormError(null) }}
                onBlur={() => setFullName(titleCaseWords(fullName))}
              />

              <Input
                placeholder="Nombre público (opcional)"
                value={displayName}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="nickname"
                onChangeText={(v) => { setDisplayName(v); setFormError(null) }}
              />

              <Input
                placeholder="Username (obligatorio: pedro.perez)"
                value={username}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                status={usernameInputStatus}
                hint={usernameHint}
                onChangeText={(v) => {
                  setUsernameTouched(true)
                  setUsername(v.replace(/\s+/g, ''))
                  setFormError(null)
                  setUsernameHint(null)
                  setUsernameStatus('idle')
                }}
              />

              <Input
                placeholder="Email"
                value={email}
                onChangeText={(v) => { setEmail(v); setFormError(null) }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Input
                placeholder="Password"
                value={password}
                onChangeText={(v) => { setPassword(v); setFormError(null) }}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
              />
            </View>

            {formError ? (
              <View
                style={{
                  padding: t.space.sm,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.danger, 0.35),
                  backgroundColor: hexToRgba(t.colors.danger, t.isDark ? 0.14 : 0.10),
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: '700' }}>{formError}</Text>
              </View>
            ) : null}

            <View style={{ gap: t.space.sm }}>
              <Button title={busy ? '...' : 'Crear cuenta'} onPress={signUp} disabled={!canSubmit} />
              <Button title="Ya tengo cuenta" onPress={() => navigation.replace('Login')} variant="ghost" />
            </View>

            <Text style={{ color: t.colors.muted, textAlign: 'center', marginTop: 6 }}>
              Al registrarte aceptas las reglas de la comunidad.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
