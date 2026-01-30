import React, { createContext, useContext, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { hexToRgba } from '../../utils/colors'

type ToastType = 'success' | 'error' | 'info'

type ToastInput = {
  type: ToastType
  title: string
  message?: string
  durationMs?: number
}

type ToastItem = ToastInput & {
  id: string
  createdAt: number
}

type ToastCtx = {
  show: (t: ToastInput) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

function ToastCard({
  toast,
  onDismiss,
  topOffset,
}: {
  toast: ToastItem
  onDismiss: () => void
  topOffset: number
}) {
  const t = useTheme()

  // Animación simple: entra desde arriba con fade
  const y = useRef(new Animated.Value(-16)).current
  const a = useRef(new Animated.Value(0)).current

  const accent =
    toast.type === 'success'
      ? t.colors.primary
      : toast.type === 'error'
        ? t.colors.danger
        : t.colors.border

  const icon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start()

    const duration = toast.durationMs ?? 2800
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(a, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(y, { toValue: -12, duration: 160, useNativeDriver: true }),
      ]).start(({ finished }) => finished && onDismiss())
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: topOffset,
        left: 14,
        right: 14,
        transform: [{ translateY: y }],
        opacity: a,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: t.colors.card,
          borderWidth: 1,
          borderColor: hexToRgba(t.colors.border, 0.9),
          borderRadius: 16,
          overflow: 'hidden',
          shadowOpacity: 0.16,
          shadowRadius: 16,
          elevation: 2,
        }}
      >
        {/* Accent bar */}
        <View style={{ height: 3, backgroundColor: accent }} />

        <View style={{ padding: 12, flexDirection: 'row', gap: 10 }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>

          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.text, fontWeight: '900' }}>{toast.title}</Text>
            {!!toast.message && (
              <Text style={{ marginTop: 2, color: t.colors.muted, fontWeight: '600' }}>
                {toast.message}
              </Text>
            )}
          </View>

          <Text style={{ color: t.colors.muted, fontWeight: '900' }}>✕</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const show = (input: ToastInput) => {
    seq.current += 1
    const toast: ToastItem = {
      ...input,
      id: `${Date.now()}_${seq.current}`,
      createdAt: Date.now(),
    }

    setToasts((prev) => {
      // máx 3 (se siente pro y evita spam)
      const next = [toast, ...prev].slice(0, 3)
      return next
    })
  }

  const api = useMemo<ToastCtx>(() => {
    return {
      show,
      success: (title, message) => show({ type: 'success', title, message }),
      error: (title, message) => show({ type: 'error', title, message }),
      info: (title, message) => show({ type: 'info', title, message }),
    }
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {/* Children normales */}
      <View style={{ flex: 1 }}>
        {children}

        {/* Overlay toasts (arriba) */}
        <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
          {toasts.map((toast, idx) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onDismiss={() => remove(toast.id)}
              topOffset={insets.top + 10 + idx * 78} // stack suave
            />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Para que nunca truene si olvidas el provider (en dev)
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    } as ToastCtx
  }
  return ctx
}
