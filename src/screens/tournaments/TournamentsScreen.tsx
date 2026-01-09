import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'

export function TournamentsScreen() {
  const t = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.space.lg, gap: t.space.md }}>
      <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '700' }}>Torneos</Text>

      <View style={{ padding: t.space.md, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md }}>
        <Text style={{ color: t.colors.muted }}>
          Aún no tienes torneos. (Siguiente paso: crear tablas `tournaments` y `tournament_roles`).
        </Text>
      </View>
    </View>
  )
}
