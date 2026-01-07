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
import { supabase } from '../../lib/supabase'
import { ThemeModeProvider, useTheme, useThemeMode } from '../../theme/theme'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

// --- helpers (igual que ya tienes) ---
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
  const bubbleSecondary = t.isDark ? 'rgba(56, 189, 248, 0.10)' : 'rgba(59, 130, 246, 0.08)'

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

/**
 * AuthScreen:
 * - envolvemos SOLO este screen con ThemeModeProvider
 * - así el toggle afecta únicamente aquí
 */
export function AuthScreen() {
  return (
    <ThemeModeProvider initialMode="system">
      <AuthScreenInner />
    </ThemeModeProvider>
  )
}

function AuthScreenInner() {
  const t = useTheme()
  const { mode, setMode } = useThemeMode()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const emailTrim = email.trim()

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

  /**
   * Toggle local:
   * - si estás viendo dark -> cambia a light
   * - si estás viendo light -> cambia a dark
   * Nota: aunque el mode esté en 'system', t.isDark refleja lo que se está mostrando,
   * así que el toggle funciona igual.
   */
  const toggleTheme = () => setMode(t.isDark ? 'light' : 'dark')

  const signIn = async () => {
    const msg = validate()
    setFormError(msg)
    setInfoMessage(null)
    if (msg) return

    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: emailTrim, password })
      if (error) setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const signUp = async () => {
    const msg = validate()
    setFormError(msg)
    setInfoMessage(null)
    if (msg) return

    setBusy(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email: emailTrim, password })
      if (error) return setFormError(error.message)

      if (!data.session) setInfoMessage('Te enviamos un correo para confirmar tu cuenta. Luego inicia sesión.')
      else setInfoMessage('Cuenta creada ✅')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <BubblesBackground />

      {/* Botón toggle (arriba derecha) */}
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
          backgroundColor: t.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.06)',
        }}
      >
        {/* Icono simple sin libs */}
        <Text style={{ color: t.colors.text, fontWeight: '800' }}>
          {t.isDark ? '☀️' : '🌙'}
        </Text>

        {/* Si quieres mostrar modo actual (opcional):
        <Text style={{ color: t.colors.muted, fontSize: 12 }}>
          {mode === 'system' ? 'Auto' : mode}
        </Text>
        */}
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
                Torneos rápidos, resultados claros.
              </Text>
            </View>

            <View style={{ gap: t.space.sm }}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  setFormError(null)
                  setInfoMessage(null)
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Input
                placeholder="Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  setFormError(null)
                  setInfoMessage(null)
                }}
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

            {infoMessage ? (
              <View
                style={{
                  padding: t.space.sm,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.primary, 0.35),
                  backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.10),
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: '700' }}>{infoMessage}</Text>
              </View>
            ) : null}

            <View style={{ gap: t.space.sm }}>
              <Button title={busy ? '...' : 'Iniciar sesión'} onPress={signIn} disabled={!canSubmit} />
              <Button title={busy ? '...' : 'Crear cuenta'} onPress={signUp} disabled={!canSubmit} variant="ghost" />
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
