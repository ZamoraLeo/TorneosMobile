import React, { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, useThemeMode } from '../../theme/theme'
import { Button, Input } from '../../components/ui'
import type { AuthError } from '@supabase/supabase-js'
import { signInWithPassword } from '../../services/auth.service'
import { hexToRgba } from '../../utils/colors'

function humanizeLoginError(error: AuthError): string {
  const msg = (error.message || '').toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (msg.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Revisa tu email.'
  }

  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  }

  if (msg.includes('user not found')) {
    return 'No existe una cuenta con ese email.'
  }

  return error.message
}


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

type Props = { navigation: any; route: any } // para no pelear con types ahorita

export function LoginScreen({ navigation, route }: Props) {
  const t = useTheme()
  const { setMode } = useThemeMode()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const emailTrim = email.trim()

  React.useEffect(() => {
    const fromRegister = route?.params?.email
    if (typeof fromRegister === 'string' && fromRegister.length > 0) {
      setEmail(fromRegister)
    }
  }, [route?.params?.email])

  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!emailTrim) return false
    if (!isValidEmail(emailTrim)) return false
    if (!password) return false
    if (password.length < 6) return false
    return true
  }, [busy, emailTrim, password])

  const validate = () => {
    if (!emailTrim) return 'Escribe tu email.'
    if (!isValidEmail(emailTrim)) return 'El email no parece válido.'
    if (!password) return 'Escribe tu contraseña.'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  const toggleTheme = () => setMode(t.isDark ? 'light' : 'dark')

  const signIn = async () => {
    const msg = validate()
    setFormError(msg)
    if (msg) return
  
    setBusy(true)
    try {
      const res = await signInWithPassword(emailTrim, password)
  
      if (!res.ok) {
        setFormError(humanizeLoginError(res.error))
        return
      }
  
    } finally {
      setBusy(false)
    }
  }  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <BubblesBackground />

      {/* Toggle tema */}
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
                Inicia sesión para ver y crear torneos.
              </Text>
            </View>

            <View style={{ gap: t.space.sm }}>
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
              <Button title={busy ? '...' : 'Iniciar sesión'} onPress={signIn} disabled={!canSubmit} />
              <Button
                title="Crear cuenta"
                onPress={() => navigation.navigate('Register')}
                variant="ghost"
              />
            </View>

            <Text style={{ color: t.colors.muted, textAlign: 'center', marginTop: 6 }}>
              Versión alpha • Android
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
