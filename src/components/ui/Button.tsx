import React from 'react'
import { ActivityIndicator, Pressable, Text, View, ViewStyle } from 'react-native'
import { useTheme } from '../../theme/theme'
import { hexToRgba } from '../../utils/colors'

type Variant = 'primary' | 'ghost' | 'danger'

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: Variant
  style?: ViewStyle
}) {
  const t = useTheme()

  const isDisabled = disabled || loading

  const baseBg =
    variant === 'primary'
      ? t.colors.primary
      : variant === 'danger'
        ? t.colors.danger
        : 'transparent'

  const borderColor =
    variant === 'ghost' ? t.colors.border : 'transparent'

  const textColor =
    variant === 'ghost' ? t.colors.text : '#FFFFFF'

  // feedback al presionar (sin romper el look)
  const pressedBg =
    variant === 'ghost'
      ? hexToRgba(t.colors.text, t.isDark ? 0.08 : 0.06)
      : hexToRgba(baseBg as string, 0.85)

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.6 : pressed ? 0.92 : 1,
        backgroundColor: pressed ? pressedBg : baseBg,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor,
        paddingVertical: t.space.sm,
        paddingHorizontal: t.space.md,
        borderRadius: t.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        ...style,
      })}
    >
      {loading ? <ActivityIndicator /> : null}
      <Text style={{ color: textColor, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  )
}
