import React from 'react'
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../theme/theme'

export type InputStatus = 'idle' | 'loading' | 'success' | 'error'

type Props = TextInputProps & {
  status?: InputStatus
  hint?: string | null
  containerStyle?: StyleProp<ViewStyle>
}

export function Input({
  status = 'idle',
  hint,
  style,
  containerStyle,
  ...props
}: Props) {
  const t = useTheme()

  const borderColor =
    status === 'success'
      ? t.colors.primary
      : status === 'error'
        ? t.colors.danger
        : t.colors.border

  const hintColor =
    status === 'success'
      ? t.colors.primary
      : status === 'error'
        ? t.colors.danger
        : t.colors.muted

  const rightNode =
    status === 'loading' ? (
      <ActivityIndicator />
    ) : status === 'success' ? (
      <Text style={{ color: t.colors.primary, fontWeight: '900', fontSize: 14 }}>✓</Text>
    ) : status === 'error' ? (
      <Text style={{ color: t.colors.danger, fontWeight: '900', fontSize: 14 }}>!</Text>
    ) : null

  return (
    <View style={containerStyle}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor,
          borderRadius: t.radius.md,
          paddingHorizontal: t.space.sm,
          paddingVertical: 8,
          backgroundColor: t.colors.card,
        }}
      >
        <TextInput
          {...props}
          placeholderTextColor={t.colors.muted}
          style={[
            {
              flex: 1,
              color: t.colors.text,
              paddingVertical: 0,
            },
            style,
          ]}
        />

        {rightNode ? <View style={{ marginLeft: 10 }}>{rightNode}</View> : null}
      </View>

      {hint ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: '600',
            color: hintColor,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  )
}
