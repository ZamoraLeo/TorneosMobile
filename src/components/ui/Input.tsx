import React from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { useTheme } from '../../theme/theme'

export function Input(props: TextInputProps) {
  const t = useTheme()
  return (
    <TextInput
      {...props}
      placeholderTextColor={t.colors.muted}
      style={[
        {
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.md,
          padding: t.space.sm,
          color: t.colors.text,
          backgroundColor: t.colors.card,
        },
        props.style,
      ]}
    />
  )
}
