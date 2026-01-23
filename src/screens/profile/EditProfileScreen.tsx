import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'

export function EditProfileScreen() {
  const t = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.space.lg }}>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
          Editar perfil
        </Text>
        <Text style={{ color: t.colors.muted, marginTop: 8 }}>
          Aquí pondremos: cambiar nombre visible, username, avatar y contraseña.
        </Text>
      </View>
    </SafeAreaView>
  )
}
