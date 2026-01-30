import React, { useMemo, useState } from 'react'
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
import { hexToRgba } from '../../utils/colors'

export type InputStatus = 'idle' | 'loading' | 'success' | 'error'
type ShowErrorWhen = 'touched' | 'always' | 'never'

type Props = TextInputProps & {
  status?: InputStatus
  hint?: string | null
  containerStyle?: StyleProp<ViewStyle>

  errorText?: string | null

  validate?: (value: string) => string | null
  showErrorWhen?: ShowErrorWhen
}

export function Input({
  status: statusProp = 'idle',
  hint,
  style,
  containerStyle,
  errorText,
  validate,
  showErrorWhen = 'touched',
  onFocus,
  onBlur,
  onChangeText,
  value,
  defaultValue,
  ...props
}: Props) {
  const t = useTheme()

  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)

  const currentValue = (value ?? defaultValue ?? '') as string

  const validationError = useMemo(() => {
    if (!validate) return null
    return validate(currentValue)
  }, [validate, currentValue])

  const finalError = errorText ?? validationError

  const shouldShowError =
    showErrorWhen === 'never'
      ? false
      : showErrorWhen === 'always'
        ? !!finalError
        : touched && !!finalError

  const derivedStatus: InputStatus =
    statusProp !== 'idle'
      ? statusProp
      : shouldShowError
        ? 'error'
        : 'idle'

  const borderColor =
    derivedStatus === 'success'
      ? t.colors.primary
      : derivedStatus === 'error'
        ? t.colors.danger
        : focused
          ? hexToRgba(t.colors.primary, 0.75)
          : t.colors.border

  const bgColor =
    derivedStatus === 'error'
      ? hexToRgba(t.colors.danger, t.isDark ? 0.08 : 0.06)
      : t.colors.card

  const hintColor =
    derivedStatus === 'success'
      ? t.colors.primary
      : derivedStatus === 'error'
        ? t.colors.danger
        : t.colors.muted

  const rightNode =
    derivedStatus === 'loading' ? (
      <ActivityIndicator />
    ) : derivedStatus === 'success' ? (
      <Text style={{ color: t.colors.primary, fontWeight: '900', fontSize: 14 }}>✓</Text>
    ) : derivedStatus === 'error' ? (
      <Text style={{ color: t.colors.danger, fontWeight: '900', fontSize: 14 }}>!</Text>
    ) : null

  const helperText = shouldShowError ? finalError : hint

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
          backgroundColor: bgColor,
        }}
      >
        <TextInput
          {...props}
          value={value}
          defaultValue={defaultValue}
          onChangeText={(txt) => {
            if (!touched) setTouched(true)
            onChangeText?.(txt)
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            setTouched(true)
            onBlur?.(e)
          }}
          placeholderTextColor={t.colors.muted}
          style={[
            {
              flex: 1,
              color: t.colors.text,
              paddingVertical: 0,
              fontWeight: '700',
            },
            style,
          ]}
        />

        {rightNode ? <View style={{ marginLeft: 10 }}>{rightNode}</View> : null}
      </View>

      {helperText ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: '700',
            color: hintColor,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}
