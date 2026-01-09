import React, { useEffect, useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useTheme } from '../theme/theme'
import { useAuthHealthCheck } from '../auth/useAuthHealthCheck'

import { MainTabsNavigator } from './MainTabsNavigator'
import { AuthStackNavigator } from './AuthStackNavigator'

export type RootStackParamList = {
  Auth: undefined
  MainTabs: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function Splash() {
  const t = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando…</Text>
    </View>
  )
}

export function AppNavigator() {
  const t = useTheme()
  useAuthHealthCheck()

  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setAuthReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Si todavía no está ready (caso raro), lo ponemos ready aquí también
      setSession(newSession)
      setAuthReady(true)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const navTheme = useMemo(() => {
    return {
      ...DefaultTheme,
      dark: t.isDark,
      colors: {
        ...DefaultTheme.colors,
        primary: t.colors.primary,
        background: t.colors.bg,
        card: t.colors.header,
        text: t.colors.headerText,
        border: t.colors.border,
        notification: t.colors.primary,
      },
    }
  }, [t])

  if (!authReady) return <Splash />

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
