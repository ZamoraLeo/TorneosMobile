import React from 'react'
import { Pressable, Text, ViewStyle } from 'react-native'
import { useTheme } from '../../theme/theme'

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
  style?: ViewStyle
}) {
  const t = useTheme()

  const bg =
    variant === 'primary' ? t.colors.primary :
    variant === 'danger' ? t.colors.danger :
    'transparent'

  const borderColor = variant === 'ghost' ? t.colors.border : 'transparent'
  const textColor = variant === 'ghost' ? t.colors.text : '#FFFFFF'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.6 : 1,
        backgroundColor: bg,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor,
        paddingVertical: t.space.sm,
        paddingHorizontal: t.space.md,
        borderRadius: t.radius.md,
        alignItems: 'center',
        ...style,
      }}
    >
      <Text style={{ color: textColor, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  )
}
