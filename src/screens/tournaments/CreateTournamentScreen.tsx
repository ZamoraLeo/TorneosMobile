import React, { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../theme/theme'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast'

import { createTournamentMvp } from '../../services/tournaments.service'
import { getErrorMessage, logError } from '../../utils/logger'

type Props = { navigation: any; route: any }

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function CreateTournamentScreen({ navigation }: Props) {
  const t = useTheme()
  const toast = useToast()
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const nameTrim = name.trim()

  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!nameTrim) return false
    if (nameTrim.length < 3) return false
    return true
  }, [busy, nameTrim])

  const create = async () => {
    setErrorText(null)

    if (!nameTrim) {
      setErrorText('Escribe el nombre del torneo.')
      return
    }

    if (nameTrim.length < 3) {
      setErrorText('El nombre debe tener al menos 3 caracteres.')
      return
    }

    setBusy(true)
    try {
      const res = await createTournamentMvp({ name: nameTrim })

      if (!res.ok) {
        const msg = res.error?.message || 'No se pudo crear el torneo.'
        setErrorText(msg)
        toast.error('Error', msg)
        return
      }

      toast.success('Torneo creado', 'Se creó como borrador ✅')
      navigation.goBack()
    } catch (e) {
      logError('CreateTournament.create.exception', e)
      const msg = getErrorMessage(e)
      setErrorText(msg)
      toast.error('Error', msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      {/* espacio arriba (safe area) */}
      <View style={{ height: Math.max(insets.top * 0.08, 6) }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            {/* Header */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '900' }}>
                Crear torneo
              </Text>
              <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
                Se creará con configuración default (MVP) en modo borrador.
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: t.space.sm }}>
              <Input
                placeholder="Nombre del torneo"
                value={name}
                onChangeText={(v) => {
                  setName(v)
                  setErrorText(null)
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Error */}
            {errorText ? (
              <View
                style={{
                  padding: t.space.sm,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.danger, 0.35),
                  backgroundColor: hexToRgba(t.colors.danger, t.isDark ? 0.14 : 0.10),
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: '800' }}>
                  {errorText}
                </Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={{ gap: t.space.sm }}>
              <Button
                title={busy ? 'Creando...' : 'Crear torneo'}
                onPress={create}
                disabled={!canSubmit}
              />
              <Button
                title="Cancelar"
                onPress={() => navigation.goBack()}
                variant="ghost"
              />
            </View>

            <Text style={{ color: t.colors.muted, textAlign: 'center', marginTop: 6 }}>
              BracketFlow • Torneos
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
