import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'

export function HomeScreen() {
  const t = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.space.lg, gap: t.space.md }}>
      <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '800' }}>Dashboard</Text>
      <Text style={{ color: t.colors.muted }}>
        Aquí luego pondremos: próximos torneos, botón “Crear torneo”, accesos rápidos, etc.
      </Text>
    </View>
  )
}