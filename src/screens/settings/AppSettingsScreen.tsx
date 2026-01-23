import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'

export function AppSettingsScreen() {
  const t = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.space.lg }}>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
          Configuración
        </Text>
        <Text style={{ color: t.colors.muted, marginTop: 8 }}>
          Aquí irá configuración de la app (tema, preferencias, etc).
        </Text>
      </View>
    </SafeAreaView>
  )
}
