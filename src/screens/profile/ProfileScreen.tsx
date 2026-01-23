import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { Button } from '../../components/ui/Button'
import { getMyProfile } from '../../services/profiles.service'
import type { MyProfile } from '../../domain/profiles'
import { signOut } from '../../services/auth.service'

type Props = { navigation: any }

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase()
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 18,
        padding: t.space.lg,
        gap: 10,
      }}
    >
      {children}
    </View>
  )
}

function ActionRow({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string
  subtitle?: string
  icon: string
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 18,
        padding: t.space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14),
          borderWidth: 1,
          borderColor: hexToRgba(t.colors.primary, 0.35),
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 15 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text style={{ color: t.colors.muted, fontWeight: '900' }}>›</Text>
    </Pressable>
  )
}

export function ProfileScreen({ navigation }: Props) {
  const t = useTheme()
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MyProfile | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getMyProfile()
  
    if (!res.ok) {
      Alert.alert('Error', res.error?.message || 'No se pudo cargar tu perfil.')
      setProfile(null)
    } else {
      setProfile(res.data)
    }
  
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const doSignOut = async () => {
    setBusy(true)
    const res = await signOut()
    setBusy(false)
    if (!res.ok) Alert.alert('Error', res.error?.message || 'No se pudo cerrar sesión.')
  }

  const displayName = useMemo(() => {
    return (
      profile?.display_name?.trim() ||
      profile?.full_name?.trim() ||
      (profile?.username ? `@${profile.username}` : 'Usuario')
    )
  }, [profile?.display_name, profile?.full_name, profile?.username])

  const usernameLabel = useMemo(() => {
    if (profile?.username) return `@${profile.username}`
    return 'Sin username'
  }, [profile?.username])

  const avatarText = useMemo(() => {
    const base = profile?.display_name || profile?.full_name || profile?.username || ''
    return initialsFromName(base || 'U')
  }, [profile?.display_name, profile?.full_name, profile?.username])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.space.lg, gap: t.space.md }}>
        {/* Header */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 999,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14),
                borderWidth: 1,
                borderColor: hexToRgba(t.colors.primary, 0.35),
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 66, height: 66 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 20 }}>
                  {avatarText}
                </Text>
              )}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
                {loading ? 'Cargando…' : displayName}
              </Text>
              <Text style={{ color: t.colors.muted, fontWeight: '800' }}>
                {loading ? '—' : usernameLabel}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: t.colors.border, marginTop: 8 }} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Editar datos"
                onPress={() => navigation.navigate('EditProfile')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Configuración"
                onPress={() => navigation.navigate('AppSettings')}
                variant="ghost"
              />
            </View>
          </View>
        </Card>

        {/* Acciones */}
        <ActionRow
          title="Editar datos"
          subtitle="Nombre visible, contraseña, avatar…"
          icon="✏️"
          onPress={() => navigation.navigate('EditProfile')}
        />

        <ActionRow
          title="Configuración"
          subtitle="Ajustes generales de la app"
          icon="⚙️"
          onPress={() => navigation.navigate('AppSettings')}
        />

        <Card>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
            Sesión
          </Text>
          <Button
            title={busy ? '...' : 'Cerrar sesión'}
            onPress={doSignOut}
            disabled={busy}
            variant="danger"
          />
        </Card>

        <Text style={{ color: t.colors.muted, textAlign: 'center', fontWeight: '700' }}>
          BracketFlow • Alpha
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
