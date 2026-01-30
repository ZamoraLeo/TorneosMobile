import React from 'react'
import { Text, View, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme, useThemeMode } from '../../theme/theme'
import { Toggle } from '../../components/ui'
import { hexToRgba } from '../../utils/colors'

export function AppSettingsScreen() {
  const t = useTheme()
  const { setMode } = useThemeMode()

  const toggleTheme = () => setMode(t.isDark ? 'light' : 'dark')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <View style={{ padding: t.space.lg, gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 22 }}>
            Configuración
          </Text>
          <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
            Ajusta la apariencia y preferencias de la app.
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: hexToRgba(t.colors.border, 0.95),
            backgroundColor: t.colors.card,
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <View style={{ height: 3, backgroundColor: t.colors.primary }} />

          <View style={{ padding: t.space.md, gap: 10 }}>
            <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
              Apariencia
            </Text>

            <Toggle
              label="Modo oscuro"
              value={t.isDark}
              onChange={toggleTheme}
            />

            <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
              Cambia entre tema claro y oscuro.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
