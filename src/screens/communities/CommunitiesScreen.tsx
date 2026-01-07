import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'

export function CommunitiesScreen() {
  const t = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.space.lg }}>
      <Text style={{ color: t.colors.text, fontWeight: '700' }}>Comunidades (secundario)</Text>
      <Text style={{ color: t.colors.muted, marginTop: 8 }}>
        Aquí luego ponemos: listar/crear comunidades. Ya existe backend para esto.
      </Text>
    </View>
  )
}
