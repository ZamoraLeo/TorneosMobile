import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { Button } from '../../components/ui'
import { deleteTournament, listMyTournaments } from '../../services/tournaments.service'
import type { TournamentListItem } from '../../domain/tournaments'
import { useFocusEffect } from '@react-navigation/native'

type Props = { navigation: any }

const PAGE_SIZE = 20

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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

function statusColors(t: ReturnType<typeof useTheme>, s: TournamentListItem['status']) {
  const base =
    s === 'running'
      ? t.colors.primary
      : s === 'completed'
        ? '#3B82F6'
        : s === 'cancelled'
          ? t.colors.danger
          : t.colors.border

  return {
    border: hexToRgba(base, 0.5),
    bg: hexToRgba(base, t.isDark ? 0.18 : 0.10),
    text: t.colors.text,
  }
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
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
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
        Aún no tienes torneos
      </Text>
      <Text style={{ color: t.colors.muted, lineHeight: 20 }}>
        Crea tu primer torneo y empieza a agregar participantes.
      </Text>

      <View style={{ marginTop: 6 }}>
        <Button title="Crear torneo" onPress={onCreate} />
      </View>
    </View>
  )
}

function TournamentCard({
  item,
  onPress,
  onDelete,
}: {
  item: TournamentListItem
  onPress: () => void
  onDelete: () => void
}) {
  const t = useTheme()
  const c = statusColors(t, item.status)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 18,
        padding: t.space.md,
        gap: 10,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.bg,
              }}
            >
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 12 }}>
                {statusLabel(item.status)}
              </Text>
            </View>

            <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
              Creado: {formatDateES(item.created_at)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onDelete}
          hitSlop={12}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: hexToRgba(t.colors.danger, 0.35),
            backgroundColor: hexToRgba(t.colors.danger, t.isDark ? 0.14 : 0.10),
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: t.colors.text, fontWeight: '900' }}>🗑️</Text>
        </Pressable>
      </View>

      <Text style={{ color: t.colors.muted, fontWeight: '600', fontSize: 12 }}>
        Toca para abrir el torneo
      </Text>
    </Pressable>
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
        // no bloqueamos toda la pantalla, solo avisamos arriba si quieres
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

  const goCreate = () => {
    navigation.navigate('CreateTournament')
  }

  const onOpenTournament = (id: string) => {
    navigation.navigate('TournamentDetails', { tournamentId: id })
  }

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
    return (
      <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.lg, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '900' }}>
              Torneos
            </Text>
            <Text style={{ color: t.colors.muted, fontWeight: '600' }} numberOfLines={1}>
              Tus torneos creados.
            </Text>
          </View>

          <View style={{ width: 110 }}>
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
  }, [t, errorText, goCreate])

  const footer = useMemo(() => {
    if (!loadingMore) return null
    return (
      <View style={{ paddingVertical: 14, alignItems: 'center', gap: 8 }}>
        <ActivityIndicator />
        <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
          Cargando más…
        </Text>
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
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
            Cargando torneos...
          </Text>
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
              <TournamentCard
                item={item}
                onPress={() => onOpenTournament(item.id)}
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
