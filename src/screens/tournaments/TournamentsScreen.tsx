import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Swipeable } from 'react-native-gesture-handler'

import { useTheme } from '../../theme/theme'
import { Button } from '../../components/ui'
import { deleteTournament, listMyTournaments } from '../../services/tournaments.service'
import type { TournamentListItem } from '../../domain/tournaments'
import { hexToRgba } from '../../utils/colors'

// ✅ Si instalaste Ionicons:
import Ionicons from '@react-native-vector-icons/ionicons'
// Si instalaste MaterialCommunityIcons, sería algo como:
// import { MaterialCommunityIcons } from '@react-native-vector-icons/material-community-icons'

type Props = { navigation: any }

const PAGE_SIZE = 20

function formatDateES(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })
}

function statusLabel(s: TournamentListItem['status']) {
  switch (s) {
    case 'draft': return 'Borrador'
    case 'open': return 'Inscripción'
    case 'locked': return 'Bloqueado'
    case 'running': return 'En curso'
    case 'completed': return 'Finalizado'
    case 'cancelled': return 'Cancelado'
    default: return s
  }
}

function statusBaseColor(t: ReturnType<typeof useTheme>, s: TournamentListItem['status']) {
  switch (s) {
    case 'draft':
      return t.isDark ? '#6B7280' : '#9CA3AF' // gris “borrador”
    case 'open':
      return '#22C55E' // verde “abierto”
    case 'locked':
      return '#F59E0B' // ámbar “bloqueado”
    case 'running':
      return '#3B82F6' // azul “en curso”
    case 'completed':
      return '#8B5CF6' // morado “finalizado”
    case 'cancelled':
      return t.colors.danger // rojo
    default:
      return t.colors.border
  }
}

function statusIconName(s: TournamentListItem['status']) {
  switch (s) {
    case 'draft': return 'create-outline'
    case 'open': return 'megaphone-outline'
    case 'locked': return 'lock-closed-outline'
    case 'running': return 'play-circle-outline'
    case 'completed': return 'trophy'
    case 'cancelled': return 'close-circle-outline'
    default: return 'trophy-outline'
  }
}

function statusChip(t: ReturnType<typeof useTheme>, status: TournamentListItem['status']) {
  const base = statusBaseColor(t, status)
  return {
    bg: hexToRgba(base, t.isDark ? 0.18 : 0.10),
    border: hexToRgba(base, 0.45),
    text: t.colors.text,
  }
}

function disciplineLabel(raw?: string | null) {
  if (!raw) return null
  const key = String(raw).trim()
  if (!key) return null

  // Por ahora: mapeo mínimo (puedes crecerlo luego o conectar a catálogo)
  const map: Record<string, string> = {
    beyblade_x: 'Beyblade X',
  }

  return map[key] ?? key
}

function DisciplineChip({ value }: { value: string }) {
  const t = useTheme()

  // “verde pro” pero suave (no compite con el status)
  const bg = hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.08)
  const border = hexToRgba(t.colors.primary, 0.25)
  const text = t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D' // verde oscuro como tu trofeo

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        maxWidth: 120,
      }}
    >
      <Ionicons name="game-controller-outline" size={14} color={text} />
      <Text
        style={{ color: text, fontWeight: '900', fontSize: 12 }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  )
}

function RightDeleteAction({
  dragX,
  onPress,
}: {
  dragX: Animated.AnimatedInterpolation<string | number>
  onPress: () => void
}) {
  const t = useTheme()

  // dragX es negativo al swippear a la izquierda
  const scale = dragX.interpolate({
    inputRange: [-120, -60, 0],
    outputRange: [1, 0.96, 0.9],
    extrapolate: 'clamp',
  })

  const opacity = dragX.interpolate({
    inputRange: [-120, -30, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: 'clamp',
  })

  return (
    <Animated.View
      style={{
        width: 96,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: [{ scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 74,
          height: 74,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: hexToRgba(t.colors.danger, t.isDark ? 0.24 : 0.14),
          borderWidth: 1,
          borderColor: hexToRgba(t.colors.danger, 0.45),
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <Ionicons name="trash" size={20} color={t.colors.text} />
        <Text style={{ marginTop: 6, color: t.colors.text, fontWeight: '900', fontSize: 11 }}>
          Borrar
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTheme()

  const cardBg = t.isDark ? t.colors.card : '#FFFFFF'

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: t.colors.border,
        padding: t.space.lg,
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: t.isDark ? 0.25 : 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.12),
            borderWidth: 1,
            borderColor: hexToRgba(t.colors.primary, 0.35),
          }}
        >
          <Ionicons
            name="trophy"
            size={22}
            // ✅ trofeo con verde más oscuro (modo claro) y más vivo en modo oscuro
            color={t.isDark ? '#4ADE80' : '#14532D'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
            Aún no tienes torneos
          </Text>
          <Text style={{ color: t.colors.muted, marginTop: 4, fontWeight: '600' }}>
            Crea uno y comienza a registrar participantes.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 8 }}>
        <Button title="Crear torneo" onPress={onCreate} />
      </View>
    </View>
  )
}

function TournamentRow({
  item,
  onOpen,
  onDelete,
}: {
  item: TournamentListItem
  onOpen: () => void
  onDelete: () => void
}) {
  const t = useTheme()
  const swipeRef = useRef<Swipeable>(null)

  const base = statusBaseColor(t, item.status)
  const chip = statusChip(t, item.status)

  const cardBg = t.isDark ? t.colors.card : '#FFFFFF'
  const accent = statusBaseColor(t, item.status)
  const discipline = disciplineLabel(item.settings?.discipline)
  console.log(discipline);
  const handleDelete = () => {
    // cierre visual antes del alert (se siente fino)
    swipeRef.current?.close()
    onDelete()
  }

  return (
    // 1) Outer: sombra (NO overflow hidden)
    <View
      style={{
        borderRadius: 22,
  
        // Android shadow
        elevation: 6,
  
        // iOS shadow (no molesta, pero en Android se ignora)
        shadowColor: '#000',
        shadowOpacity: t.isDark ? 0.28 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
  
        // esto ayuda a que la sombra se vea en fondo claro
        backgroundColor: 'transparent',
      }}
    >
      <Swipeable
        ref={swipeRef}
        overshootRight={false}
        rightThreshold={40}
        renderRightActions={(_, dragX) => (
          <View
            style={{
              width: 110,
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingRight: 10,
            }}
          >
            <RightDeleteAction dragX={dragX} onPress={handleDelete} />
          </View>
        )}
      >
        {/* 2) Inner: recorte (SÍ overflow hidden) */}
        <View style={{ borderRadius: 22, overflow: 'hidden' }}>
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => ({
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: t.isDark ? t.colors.border : hexToRgba(t.colors.border, 0.9),
              opacity: pressed ? 0.94 : 1,
            })}
          >
            {/* Accent bar */}
            <View style={{ height: 4, backgroundColor: base }} />
  
            <View style={{ padding: t.space.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Avatar / icon */}
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hexToRgba(accent, t.isDark ? 0.18 : 0.12),
                  borderWidth: 1,
                  borderColor: hexToRgba(accent, 0.35),
                }}
              >
                <Ionicons
                  name={statusIconName(item.status)}
                  size={22}
                  color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'}
                />
              </View>
  
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                {/* 👇 Fila 1: Nombre + Disciplina */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <Text
                    style={{
                      color: t.colors.text,
                      fontWeight: '900',
                      fontSize: 16,
                      flexShrink: 1,
                      minWidth: 0,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>

                  {discipline ? (
                    <View style={{ flexShrink: 0 }}>
                      <DisciplineChip value={discipline} />
                    </View>
                  ) : null}
                </View>

                {/* 👇 Fila 2: Status + Fecha */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: chip.border,
                      backgroundColor: chip.bg,
                    }}
                  >
                    <Text style={{ color: chip.text, fontWeight: '900', fontSize: 12 }}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>

                  <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                    {formatDateES(item.created_at)}
                  </Text>
                </View>
              </View>
  
              <Ionicons name="chevron-forward" size={18} color={t.colors.muted} />
            </View>
          </Pressable>
        </View>
      </Swipeable>
    </View>
  )  
}

export function TournamentsScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const [items, setItems] = useState<TournamentListItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const loadFirstPage = useCallback(async () => {
    setErrorText(null)
    const res = await listMyTournaments({ page: 0, pageSize: PAGE_SIZE })
    if (!res.ok) {
      setErrorText(res.error?.message || 'No se pudo cargar la lista de torneos.')
      return
    }
    setItems(res.data.items)
    setPage(0)
    setHasMore(res.data.hasMore)
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    if (loadingMore || loading || refreshing) return

    const nextPage = page + 1

    setLoadingMore(true)
    try {
      const res = await listMyTournaments({ page: nextPage, pageSize: PAGE_SIZE })
      if (!res.ok) {
        setErrorText(res.error?.message || 'No se pudieron cargar más torneos.')
        return
      }
      setItems((prev) => [...prev, ...res.data.items])
      setPage(nextPage)
      setHasMore(res.data.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, loading, refreshing, page])

  useFocusEffect(
    useCallback(() => {
      ;(async () => {
        setLoading(true)
        await loadFirstPage()
        setLoading(false)
      })()
    }, [loadFirstPage])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadFirstPage()
    setRefreshing(false)
  }, [loadFirstPage])

  const goCreate = () => navigation.navigate('CreateTournament')
  const onOpenTournament = (id: string) => navigation.navigate('TournamentDetails', { tournamentId: id })

  const onDeleteTournament = (item: TournamentListItem) => {
    Alert.alert(
      'Eliminar torneo',
      `¿Seguro que quieres eliminar "${item.name}"?\n\nEsto borrará también stages, participantes y matches.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteTournament(item.id)
            if (!res.ok) {
              Alert.alert('Error', res.error?.message || 'No se pudo eliminar el torneo.')
              return
            }
            setItems((prev) => prev.filter((x) => x.id !== item.id))
          },
        },
      ]
    )
  }

  const header = useMemo(() => {
    const count = items.length
    return (
      <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.lg, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text style={{ color: t.colors.text, fontSize: 24, fontWeight: '900' }}>
              Torneos
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }} numberOfLines={1}>
                Tus torneos creados
              </Text>

              <View
                style={{
                  paddingVertical: 3,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.border, 0.9),
                  backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                }}
              >
                <Text style={{ color: t.colors.muted, fontWeight: '900', fontSize: 12 }}>
                  {count}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ width: 120 }}>
            <Button title="+ Crear" onPress={goCreate} />
          </View>
        </View>

        {errorText ? (
          <View
            style={{
              padding: t.space.sm,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: hexToRgba(t.colors.danger, 0.35),
              backgroundColor: hexToRgba(t.colors.danger, t.isDark ? 0.14 : 0.10),
            }}
          >
            <Text style={{ color: t.colors.text, fontWeight: '800' }}>{errorText}</Text>
          </View>
        ) : null}
      </View>
    )
  }, [t, errorText, goCreate, items.length])

  const footer = useMemo(() => {
    if (!loadingMore) return null
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center', gap: 8 }}>
        <ActivityIndicator />
        <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando más…</Text>
      </View>
    )
  }, [loadingMore, t])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <View style={{ height: Math.max(insets.top * 0.08, 4) }} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator />
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando torneos…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          contentContainerStyle={{ paddingBottom: t.space.lg }}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.md }}>
              <TournamentRow
                item={item}
                onOpen={() => onOpenTournament(item.id)}
                onDelete={() => onDeleteTournament(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.md }}>
              <EmptyState onCreate={goCreate} />
            </View>
          }
          onEndReachedThreshold={0.6}
          onEndReached={loadMore}
        />
      )}
    </SafeAreaView>
  )
}
