import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

import { AuthScreen } from '../screens/auth/AuthScreen'
import { TournamentsScreen } from '../screens/tournaments/TournamentsScreen'
import { CommunitiesScreen } from '../screens/communities/CommunitiesScreen'
import { SettingsScreen } from '../screens/settings/SettingsScreen'

export type RootStackParamList = {
  Auth: undefined
  Tournaments: undefined
  Communities: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tournaments" component={TournamentsScreen} options={{ title: 'Mis torneos' }} />
            <Stack.Screen name="Communities" component={CommunitiesScreen} options={{ title: 'Comunidades' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
