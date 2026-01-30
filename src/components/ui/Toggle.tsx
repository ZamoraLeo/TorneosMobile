import React from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import { useTheme } from '../../theme/theme'
import { hexToRgba } from '../../utils/colors'

export function Toggle({
  label,
  value,
  onChange,
  disabled,
  style,
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  style?: ViewStyle
}) {
  const t = useTheme()

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
        ...style,
      })}
    >
      <Text style={{ color: t.colors.text, fontWeight: '800' }}>{label}</Text>

      <View
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          padding: 3,
          backgroundColor: value
            ? hexToRgba(t.colors.primary, 0.35)
            : hexToRgba(t.colors.border, 0.25),
          borderWidth: 1,
          borderColor: value ? hexToRgba(t.colors.primary, 0.6) : t.colors.border,
          alignItems: value ? 'flex-end' : 'flex-start',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: value ? t.colors.primary : hexToRgba(t.colors.muted, 0.8),
          }}
        />
      </View>
    </Pressable>
  )
}
