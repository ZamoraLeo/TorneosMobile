import React from 'react'
import {
  Text,
  View,
} from 'react-native'

import { useTheme } from '../../../../theme/theme'

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 18,
        padding: t.space.lg,
        gap: 10,
      }}
    >
      {children}
    </View>
  )
}

export function StagesTab() {
  const t = useTheme()
  return (
    <Card>
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
        Etapas
      </Text>
      <Text style={{ color: t.colors.muted, lineHeight: 20 }}>
        Aquí irá la vista visual de la fase de grupos y la llave (bracket).
        Por ahora lo dejamos listo para más adelante.
      </Text>
    </Card>
  )
}