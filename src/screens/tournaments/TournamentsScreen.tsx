import React from 'react'
import { Text, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useTheme } from '../../theme/theme'
import { Button } from '../../components/ui/Button'

type Props = NativeStackScreenProps<RootStackParamList, 'Tournaments'>

export function TournamentsScreen({ navigation }: Props) {
  const t = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.space.lg, gap: t.space.md }}>
      <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '700' }}>Mis torneos</Text>

      <View style={{ padding: t.space.md, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md }}>
        <Text style={{ color: t.colors.muted }}>
          Aún no tienes torneos. (Siguiente paso: crear tablas `tournaments` y `tournament_roles`).
        </Text>
      </View>

      <Button title="Ir a Comunidades (secundario)" onPress={() => navigation.navigate('Communities')} variant="ghost" />
      <Button title="Ajustes" onPress={() => navigation.navigate('Settings')} variant="ghost" />
    </View>
  )
}
