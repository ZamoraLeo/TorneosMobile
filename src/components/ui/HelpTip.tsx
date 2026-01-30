import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../theme/theme'
import { hexToRgba } from '../../utils/colors'

type Props = {
  title?: string
  message: string
  icon?: string // default '?'
  style?: ViewStyle
}

export function HelpTip({ title, message, icon = '?', style }: Props) {
  const t = useTheme()
  const [open, setOpen] = useState(false)

  const a = useRef(new Animated.Value(0)).current
  const y = useRef(new Animated.Value(-6)).current

  useEffect(() => {
    if (!open) return
    a.setValue(0)
    y.setValue(-6)
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start()
  }, [open, a, y])

  const bubbleBg = t.isDark ? '#11111A' : '#FFFFFF'
  const bubbleBorder = hexToRgba(t.colors.border, 0.95)

  const circleBg = hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.12)
  const circleBorder = hexToRgba(t.colors.primary, 0.35)

  const header = useMemo(() => {
    if (!title) return null
    return (
      <Text style={{ color: t.colors.text, fontWeight: '900', marginBottom: 6 }}>
        {title}
      </Text>
    )
  }, [title, t])

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 22,
          height: 22,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: circleBorder,
          backgroundColor: circleBg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          ...style,
        })}
      >
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }}>
          {icon}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        {/* Backdrop */}
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: hexToRgba('#000000', t.isDark ? 0.55 : 0.35),
            padding: 18,
            justifyContent: 'center',
          }}
        >
          {/* Bubble */}
          <Animated.View
            style={{
              transform: [{ translateY: y }],
              opacity: a,
              alignSelf: 'stretch',
            }}
          >
            <View
              style={{
                backgroundColor: bubbleBg,
                borderWidth: 1,
                borderColor: bubbleBorder,
                borderRadius: 18,
                padding: 14,
              }}
            >
              {header}
              <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 20 }}>
                {message}
              </Text>

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: t.colors.primary, fontWeight: '900' }}>Toca para cerrar</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}
