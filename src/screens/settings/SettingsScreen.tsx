import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../theme/theme'
import { Button } from '../../components/ui/Button'

export function SettingsScreen() {
  const t = useTheme()
  const [busy, setBusy] = useState(false)

  const signOut = async () => {
    setBusy(true)
    const { error } = await supabase.auth.signOut()
    setBusy(false)
    if (error) Alert.alert('Error', error.message)
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.space.lg, gap: t.space.md }}>
      <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '700' }}>Ajustes</Text>
      <Button title={busy ? '...' : 'Cerrar sesión'} onPress={signOut} disabled={busy} variant="danger" />
    </View>
  )
}
