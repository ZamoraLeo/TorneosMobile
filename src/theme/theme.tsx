import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme, ColorSchemeName } from 'react-native'

export type Theme = ReturnType<typeof getTheme>

/**
 * Tema base: aquí defines tokens (colores, espacios, radios).
 * Esto NO depende de React; es una función pura.
 */
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
      primary: isDark ? '#22C55E' : '#16A34A', // verde principal
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
  return 'light' // incluye 'light', 'unspecified' y null
}

/**
 * ThemeMode:
 * - system: usa el tema del dispositivo
 * - light/dark: override manual (ideal para un botón de toggle)
 */
export type ThemeMode = 'system' | 'light' | 'dark'

type ThemeModeCtx = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

/**
 * Context opcional:
 * Si NO envuelves tu app/pantalla con el provider, se usará 'system'.
 */
const ThemeModeContext = createContext<ThemeModeCtx | null>(null)

/**
 * Provider para override de tema.
 * Puedes usarlo global (en App.tsx) o local (solo en AuthScreen).
 */
export function ThemeModeProvider({
  children,
  initialMode = 'system',
}: {
  children: React.ReactNode
  initialMode?: ThemeMode
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  // useMemo para evitar re-renders innecesarios en consumers
  const value = useMemo(() => ({ mode, setMode }), [mode])

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

/**
 * Hook para leer/cambiar el modo del provider si existe.
 * Si no existe provider, regresamos 'system' con setMode no-op.
 */
export function useThemeMode(): ThemeModeCtx {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) return { mode: 'system', setMode: () => {} }
  return ctx
}

/**
 * useTheme:
 * - Por defecto: usa el color scheme del sistema
 * - Si hay ThemeModeProvider encima:
 *    - light/dark forzan el tema
 *    - system vuelve al del dispositivo
 */
export function useTheme() {
  const systemScheme = normalizeScheme(useColorScheme())
  const ctx = useContext(ThemeModeContext)

  const scheme: 'light' | 'dark' =
    ctx?.mode && ctx.mode !== 'system' ? ctx.mode : systemScheme

  return useMemo(() => getTheme(scheme), [scheme])
}
