import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeModeProvider } from './src/theme/theme'
import { ToastProvider } from './src/components/ui/toast'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <ThemeModeProvider initialMode="system">
      <SafeAreaProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeModeProvider>
  )
}