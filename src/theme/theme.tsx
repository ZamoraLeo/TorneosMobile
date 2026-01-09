import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme, ColorSchemeName, View, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Theme = ReturnType<typeof getTheme>

export function getTheme(scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark'
  return {
    isDark,
    colors: {
      bg: isDark ? '#0B0B0F' : '#FFFFFF',
      card: isDark ? '#141421' : '#F6F6F8',
      text: isDark ? '#FFFFFF' : '#0A0A0A',
      muted: isDark ? '#A7A7B7' : '#5A5A6A',
      border: isDark ? '#2A2A3A' : '#E4E4EA',
      primary: isDark ? '#22C55E' : '#16A34A',
      header: isDark ? '#101018' : '#FFFFFF',
      headerText: isDark ? '#FFFFFF' : '#0A0A0A',
      danger: '#E5484D',
    },
    space: {
      xs: 6,
      sm: 10,
      md: 14,
      lg: 18,
    },
    radius: {
      md: 12,
    },
  }
}

function normalizeScheme(scheme: ColorSchemeName): 'light' | 'dark' {
  if (scheme === 'dark') return 'dark'
  return 'light'
}

export type ThemeMode = 'system' | 'light' | 'dark'

type ThemeModeCtx = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  isReady: boolean
}

const ThemeModeContext = createContext<ThemeModeCtx | null>(null)

const STORAGE_KEY = 'theme_mode_v1'

function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

export function ThemeModeProvider({ children, initialMode = 'system' }: { children: React.ReactNode; initialMode?: ThemeMode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (isThemeMode(saved)) setModeState(saved)
      } finally {
        setIsReady(true)
      }
    })()
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }

  const value = useMemo(() => ({ mode, setMode, isReady }), [mode, isReady])

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0F' }}>
        <StatusBar barStyle="light-content" />
      </View>
    )
  }

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode(): ThemeModeCtx {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) return { mode: 'system', setMode: () => {}, isReady: true }
  return ctx
}

export function useTheme() {
  const systemScheme = normalizeScheme(useColorScheme())
  const ctx = useContext(ThemeModeContext)

  const scheme: 'light' | 'dark' =
    ctx?.mode && ctx.mode !== 'system' ? ctx.mode : systemScheme

  return useMemo(() => getTheme(scheme), [scheme])
}
