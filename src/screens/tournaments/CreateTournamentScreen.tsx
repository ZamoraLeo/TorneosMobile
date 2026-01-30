import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { Button, Input, useToast } from '../../components/ui'
import { createTournamentMvp } from '../../services/tournaments.service'
import { hexToRgba } from '../../utils/colors'

type Props = { navigation: any }

type Choice = 'default' | 'configure'

function ChoiceCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string
  subtitle: string
  selected: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const border = selected ? hexToRgba(t.colors.primary, 0.6) : t.colors.border
  const bg = selected ? hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.08) : t.colors.card

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        borderRadius: 18,
        padding: t.space.md,
        gap: 6,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
            {title}
          </Text>
          <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>

        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? t.colors.primary : hexToRgba(t.colors.border, 0.8),
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          {selected ? (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: t.colors.primary,
              }}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

export function CreateTournamentScreen({ navigation }: Props) {
  const t = useTheme()
  const toast = useToast()

  const [name, setName] = useState('')
  const [choice, setChoice] = useState<Choice>('default')
  const [saving, setSaving] = useState(false)

  const trimmedName = name.trim()
  const nameError = trimmedName.length === 0 ? 'Escribe el nombre del torneo.' : null

  const canSubmit = useMemo(() => trimmedName.length > 0 && !saving, [trimmedName, saving])

  const onCreate = async () => {
    if (!trimmedName) {
      toast.error('Nombre requerido', 'Escribe el nombre del torneo.')
      return
    }

    setSaving(true)
    try {
      const res = await createTournamentMvp({ name: trimmedName })

      if (!res.ok) {
        toast.error('Error', res.error?.message || 'No se pudo crear el torneo.')
        return
      }

      const id = res.data.tournamentId

      if (choice === 'default') {
        toast.success('Torneo creado', 'Se creó con configuración estándar.')
        navigation.goBack() // tu useFocusEffect refresca el listado
        return
      }

      toast.info('Listo', 'Ahora configura tu torneo.')
      navigation.replace('TournamentConfig', { tournamentId: id })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <View style={{ padding: t.space.lg, gap: 14 }}>
        <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '900' }}>
          Crear torneo
        </Text>
        <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
          Ponle nombre y elige cómo empezar.
        </Text>

        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.text, fontWeight: '800' }}>Nombre</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Ej. Torneo León 2026"
            returnKeyType="done"
            status={!trimmedName && name.length > 0 ? 'error' : 'idle'}
            hint={!trimmedName && name.length > 0 ? nameError : null}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: t.colors.text, fontWeight: '800' }}>Modo</Text>

          <ChoiceCard
            title="Crear con configuración estándar"
            subtitle="Se crea con el preset Default y vuelves al listado."
            selected={choice === 'default'}
            onPress={() => setChoice('default')}
          />

          <ChoiceCard
            title="Crear y configurar"
            subtitle="Se crea con Default y te lleva a editar reglas y etapas."
            selected={choice === 'configure'}
            onPress={() => setChoice('configure')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={saving}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={saving ? 'Creando…' : 'Crear'}
              onPress={onCreate}
              disabled={!canSubmit}
            />
          </View>
        </View>

        {saving ? (
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 10 }}>
            <ActivityIndicator />
            <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
              Preparando torneo…
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
