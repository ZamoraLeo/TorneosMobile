import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeModeProvider } from './src/theme/theme'
import { ToastProvider } from './src/components/ui/toast'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeModeProvider initialMode="system">
        <SafeAreaProvider>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeModeProvider>
    </GestureHandlerRootView>
  )
}