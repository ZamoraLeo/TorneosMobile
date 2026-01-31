import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'

import { useTheme } from '../../../../theme/theme'
import {
  addGuestParticipant,
  addUserParticipantByUsername,
  deleteParticipant,
  listTournamentParticipants,
  setParticipantCheckIn,
  setParticipantPaid,
  getTournamentParticipantStats
} from '../../../../services/tournaments.service'

import type {
  TournamentParticipantListItem,
} from '../../../../domain/tournaments'
import Ionicons from '@react-native-vector-icons/ionicons'

import { Button, Input } from '../../../../components/ui'
import { hexToRgba } from '../../../../utils/colors'

const PAGE_SIZE = 10

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  const bg = t.isDark ? t.colors.card : '#FFFFFF'

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: t.colors.border,
        padding: t.space.lg,
        gap: 10,

        // ✅ Android shadow (lo que sí se ve)
        elevation: 4,

        // iOS shadow (no estorba)
        shadowColor: '#000',
        shadowOpacity: t.isDark ? 0.25 : 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      {children}
    </View>
  )
}

function MiniChip({
  icon,
  label,
  baseColor,
}: {
  icon: string
  label: string
  baseColor: string
}) {
  const t = useTheme()
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
        borderColor: hexToRgba(baseColor, 0.45),
        backgroundColor: hexToRgba(baseColor, t.isDark ? 0.18 : 0.10),
      }}
    >
      <Ionicons name={icon as any} size={14} color={t.colors.text} />
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }}>
        {label}
      </Text>
    </View>
  )
}

function StatTile({
  icon,
  label,
  value,
  baseColor,
}: {
  icon: string
  label: string
  value: number
  baseColor: string
}) {
  const t = useTheme()
  const bg = t.isDark ? t.colors.card : '#FFFFFF'

  return (
    <View
      style={{
        flex: 1,
        minWidth: 90,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: hexToRgba(baseColor, 0.35),
        backgroundColor: bg,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRgba(baseColor, t.isDark ? 0.20 : 0.12),
            borderWidth: 1,
            borderColor: hexToRgba(baseColor, 0.35),
          }}
        >
          <Ionicons name={icon as any} size={16} color={t.colors.text} />
        </View>

        <Text style={{ color: t.colors.muted, fontWeight: '900', fontSize: 12 }}>
          {label}
        </Text>
      </View>

      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18 }}>
        {value}
      </Text>
    </View>
  )
}

function AvatarBubble({
  isGuest,
}: {
  isGuest: boolean
}) {
  const t = useTheme()
  const base = isGuest ? '#8B5CF6' : t.colors.primary

  return (
    <View
      style={{
        width: 46,
        height: 46,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hexToRgba(base, t.isDark ? 0.20 : 0.12),
        borderWidth: 1,
        borderColor: hexToRgba(base, 0.35),
      }}
    >
      <Ionicons
        name={(isGuest ? 'person-add' : 'person') as any}
        size={20}
        color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'}
      />
    </View>
  )
}

/**
 * ✅ Modal agregar participante (quick add)
 */
export function AddParticipantModal({
  visible,
  onClose,
  tournamentId,
  onAdded,
}: {
  visible: boolean
  onClose: () => void
  tournamentId: string
  onAdded: () => void
}) {
  const t = useTheme()

  const [mode, setMode] = useState<'user' | 'guest'>('user')
  const [username, setUsername] = useState('')
  const [guestName, setGuestName] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastOk, setLastOk] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setMode('user')
      setUsername('')
      setGuestName('')
      setBusy(false)
      setLastOk(null)
    }
  }, [visible])

  const submit = async () => {
    setBusy(true)
    setLastOk(null)

    try {
      if (mode === 'user') {
        const u = username.trim().toLowerCase()
        if (!u) return

        const res = await addUserParticipantByUsername({
          tournamentId,
          username: u,
        })

        if (!res.ok) {
          Alert.alert('No se pudo agregar', res.error?.message || 'Error')
          return
        }

        setUsername('')
        setLastOk(`Agregado: @${u}`)
      } else {
        const name = guestName.trim()
        if (!name) return

        const res = await addGuestParticipant({
          tournamentId,
          guestName: name,
        })

        if (!res.ok) {
          Alert.alert('No se pudo agregar', res.error?.message || 'Error')
          return
        }

        setGuestName('')
        setLastOk(`Agregado: ${name}`)
      }

      onAdded()
    } finally {
      setBusy(false)
    }
  }

  const canSubmit =
    !busy && (mode === 'user' ? !!username.trim() : !!guestName.trim())

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: t.space.lg,
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={() => {}}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.card,
              borderRadius: 18,
              padding: t.space.lg,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.20 : 0.12),
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.primary, 0.35),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person-add" size={18} color={t.colors.text} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
                  Agregar participante
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: t.colors.border,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={() => setMode('user')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor:
                    mode === 'user'
                      ? hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14)
                      : 'transparent',
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: mode === 'user' ? '900' : '700' }}>
                  Usuario app
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode('guest')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor:
                    mode === 'guest'
                      ? hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14)
                      : 'transparent',
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: mode === 'guest' ? '900' : '700' }}>
                  Invitado
                </Text>
              </Pressable>
            </View>

            {mode === 'user' ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                  Username exacto (por ahora)
                </Text>
                <Input
                  placeholder="username"
                  value={username}
                  autoCapitalize="none"
                  onChangeText={(v) => setUsername(v.toLowerCase())}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                  Nombre del invitado
                </Text>
                <Input
                  placeholder="Nombre completo"
                  value={guestName}
                  onChangeText={setGuestName}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              </View>
            )}

            {lastOk ? (
              <View
                style={{
                  padding: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.primary, 0.35),
                  backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.10),
                }}
              >
                <Text style={{ color: t.colors.text, fontWeight: '900' }}>
                  ✅ {lastOk}
                </Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Listo" onPress={onClose} variant="ghost" />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={busy ? '...' : 'Agregar'}
                  onPress={submit}
                  disabled={!canSubmit}
                />
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

/**
 * ✅ Botoncitos de swipe con iconos
 */
function SwipeIconButton({
  iconName,
  label,
  bg,
  onPress,
  disabled,
}: {
  iconName: string
  label: string
  bg: string
  onPress: () => void
  disabled?: boolean
}) {
  const t = useTheme()

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: 78,
        height: 78,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        borderWidth: 1,
        borderColor: hexToRgba('#000000', t.isDark ? 0.0 : 0.06), // sutil
      })}
    >
      <Ionicons name={iconName as any} size={22} color={t.colors.text} />
      <Text style={{ marginTop: 6, fontSize: 11, fontWeight: '900', color: t.colors.text }}>
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * ✅ Tab Participantes (Swipe acciones)
 */
export function ParticipantsTab({
  tournamentId,
  onOpenAddModal,
  reloadKey,
  tournamentPaid,
}: {
  tournamentId: string
  onOpenAddModal: () => void
  reloadKey: number
  tournamentPaid: boolean
}) {
  const t = useTheme()

  const [items, setItems] = useState<TournamentParticipantListItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [totalCount, setTotalCount] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [checkedInCount, setCheckedInCount] = useState<number>(0)
  const [paidCount, setPaidCount] = useState<number>(0)
  
  // ✅ Para evitar spam al tocar check/pago rápidamente
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({})

  type SwipeableRef = { close: () => void } | null

  const rowRefs = React.useRef<Record<string, SwipeableRef>>({})
  const openRowId = React.useRef<string | null>(null)

  const closeRow = (id: string) => {
    rowRefs.current[id]?.close?.()
  }

  const closeOpenRow = () => {
    if (openRowId.current) {
      rowRefs.current[openRowId.current]?.close?.()
      openRowId.current = null
    }
  }

  const onRowWillOpen = (id: string) => {
    // ✅ Cierra el que estaba abierto antes
    if (openRowId.current && openRowId.current !== id) {
      rowRefs.current[openRowId.current]?.close?.()
    }
    openRowId.current = id
  }

  const setBusy = (id: string, val: boolean) => {
    setBusyMap((prev) => ({ ...prev, [id]: val }))
  }

  const loadFirstPage = useCallback(async () => {
    closeOpenRow()
    const res = await listTournamentParticipants(tournamentId, {
      page: 0,
      pageSize: PAGE_SIZE,
    })
  
    if (!res.ok) {
      Alert.alert('Error', res.error?.message || 'No se pudieron cargar participantes.')
      return
    }
  
    setItems(res.data.items)
    setPage(0)
    setHasMore(res.data.hasMore)
    setTotalCount(res.data.total ?? res.data.items.length)
  
    // ✅ Conteos reales (sin traer filas)
    const stats = await getTournamentParticipantStats(tournamentId, tournamentPaid)
    if (stats.ok) {
      setCheckedInCount(stats.data.checkedIn)
      setPaidCount(stats.data.paid)
    }
  }, [tournamentId, tournamentPaid])
  

  const loadMore = useCallback(async () => {
    closeOpenRow()
    if (!hasMore) return
    if (loadingMore || loading || refreshing) return

    const nextPage = page + 1
    setLoadingMore(true)

    try {
      const res = await listTournamentParticipants(tournamentId, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      })

      if (!res.ok) {
        Alert.alert('Error', res.error?.message || 'No se pudieron cargar más participantes.')
        return
      }

      setItems((prev) => [...prev, ...res.data.items])
      setPage(nextPage)
      setHasMore(res.data.hasMore)
      setTotalCount(res.data.total ?? totalCount)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, loading, refreshing, page, tournamentId, totalCount])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await loadFirstPage()
      setLoading(false)
    })()
  }, [loadFirstPage, reloadKey])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadFirstPage()
    setRefreshing(false)
  }, [loadFirstPage])

  const remove = useCallback((p: TournamentParticipantListItem) => {
    const title = p.display_name || p.guest_name || 'Participante'

    Alert.alert(
      'Eliminar participante',
      `¿Seguro que quieres eliminar a "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteParticipant(p.id)
          
            if (!res.ok) {
              Alert.alert('Error', res.error?.message || 'No se pudo eliminar el participante.')
              return
            }
          
            setItems((prev) => prev.filter((x) => x.id !== p.id))
            setTotalCount((prev) => Math.max(0, prev - 1))
          
            if (p.checked_in) setCheckedInCount((c) => Math.max(0, c - 1))
            if (tournamentPaid && p.paid) setPaidCount((c) => Math.max(0, c - 1))
          },          
        },
      ]
    )
  }, [])

  const toggleCheckIn = useCallback(
    async (p: TournamentParticipantListItem) => {
      if (busyMap[p.id]) return
  
      const current = !!p.checked_in
      const next = !current
  
      setBusy(p.id, true)
  
      // ✅ Optimistic UI
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, checked_in: next } : x)))
      setCheckedInCount((c) => c + (next ? 1 : -1))
  
      try {
        const res = await setParticipantCheckIn(p.id, next)
  
        if (!res.ok) {
          // rollback item
          setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, checked_in: current } : x)))
          // rollback count
          setCheckedInCount((c) => c + (next ? -1 : 1))
  
          Alert.alert('Error', res.error?.message || 'No se pudo actualizar el check-in.')
        }
      } finally {
        setBusy(p.id, false)
      }
    },
    [busyMap]
  )

  const togglePaid = useCallback(
    async (p: TournamentParticipantListItem) => {
      if (busyMap[p.id]) return
  
      const current = !!p.paid
      const next = !current
  
      setBusy(p.id, true)
  
      // ✅ Optimistic UI
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, paid: next } : x)))
      if (tournamentPaid) setPaidCount((c) => c + (next ? 1 : -1))
  
      try {
        const res = await setParticipantPaid(p.id, next)
  
        if (!res.ok) {
          // rollback item
          setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, paid: current } : x)))
          // rollback count
          if (tournamentPaid) setPaidCount((c) => c + (next ? -1 : 1))
  
          Alert.alert('Error', res.error?.message || 'No se pudo actualizar el pago.')
        }
      } finally {
        setBusy(p.id, false)
      }
    },
    [busyMap, tournamentPaid]
  )

  const renderLeftActions = useCallback(
    (p: TournamentParticipantListItem) => {
      const checkBase = '#22C55E'
      const paidBase = '#F59E0B'
      const neutralBase = '#64748B'
  
      const checkBg = p.checked_in
        ? hexToRgba(checkBase, t.isDark ? 0.30 : 0.18)
        : hexToRgba(t.colors.primary, t.isDark ? 0.26 : 0.16)
  
      const paidBg = !!p.paid
        ? hexToRgba(paidBase, t.isDark ? 0.30 : 0.18)
        : hexToRgba(neutralBase, t.isDark ? 0.28 : 0.16)
  
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: t.space.lg,
            paddingRight: 10,
          }}
        >
          <SwipeIconButton
            iconName={p.checked_in ? 'checkmark-circle' : 'checkmark-circle-outline'}
            label="Check-in"
            bg={checkBg}
            disabled={busyMap[p.id]}
            onPress={() => {
              closeRow(p.id)
              toggleCheckIn(p)
            }}
          />
  
          {tournamentPaid ? (
            <SwipeIconButton
              iconName={p.paid ? 'cash' : 'cash-outline'}
              label="Pago"
              bg={paidBg}
              disabled={busyMap[p.id]}
              onPress={() => {
                closeRow(p.id)
                togglePaid(p)
              }}
            />
          ) : null}
        </View>
      )
    },
    [t, busyMap, tournamentPaid, toggleCheckIn, togglePaid]
  )  

  const renderRightActions = useCallback(
    (p: TournamentParticipantListItem) => {
      const dangerBg = hexToRgba(t.colors.danger, t.isDark ? 0.32 : 0.16)
  
      return (
        <View
          style={{
            width: 110,
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: t.space.lg,
          }}
        >
          <SwipeIconButton
            iconName="trash"
            label="Borrar"
            bg={dangerBg}
            disabled={busyMap[p.id]}
            onPress={() => {
              closeRow(p.id)
              remove(p)
            }}
          />
        </View>
      )
    },
    [remove, t, busyMap]
  )
  
  const header = useMemo(() => {
    return (
      <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.md, paddingBottom: t.space.md }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.20 : 0.12),
                    borderWidth: 1,
                    borderColor: hexToRgba(t.colors.primary, 0.35),
                  }}
                >
                  <Ionicons name="people" size={18} color={t.colors.text} />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
                    Participantes
                  </Text>
                  <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12, marginTop: 2 }}>
                    Total: {totalCount}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ minWidth: 120 }}>
              <Button title="Agregar" onPress={onOpenAddModal} />
            </View>
          </View>

          <View style={{ height: 10 }} />

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <StatTile icon="checkmark-circle-outline" label="Check-in" value={checkedInCount} baseColor="#22C55E" />
            {tournamentPaid ? (
              <StatTile icon="cash-outline" label="Pagados" value={paidCount} baseColor="#F59E0B" />
            ) : null}
          </View>
        </Card>

        {items.length === 0 && !loading ? (
          <View style={{ marginTop: t.space.md }}>
            <Card>
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>
                Aún no hay participantes
              </Text>
              <Text style={{ color: t.colors.muted, lineHeight: 20 }}>
                Agrega usuarios de la app por username o invitados manuales.
              </Text>
            </Card>
          </View>
        ) : null}
      </View>
    )
  }, [
    t,
    onOpenAddModal,
    loading,
    totalCount,
    checkedInCount,
    paidCount,
    tournamentPaid,
    items.length,
  ])

  const footer = useMemo(() => {
    if (!loadingMore) return <View style={{ height: 12 }} />

    return (
      <View style={{ paddingVertical: 14, alignItems: 'center', gap: 8 }}>
        <ActivityIndicator />
        <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando más…</Text>
      </View>
    )
  }, [loadingMore, t])

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: 20, gap: 12, alignItems: 'center' }}>
        <ActivityIndicator />
        <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
          Cargando participantes…
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={{overflow: 'visible'}}
      contentContainerStyle={{ paddingBottom: t.space.lg, overflow:'visible' }}
      renderItem={({ item: p, index }) => {
        const title = p.display_name || p.guest_name || 'Participante'
        const kind = p.user_id ? 'Usuario app' : 'Invitado'
        const isPaid = !!p.paid
            
        return (
          <View style={{ paddingTop: index === 0 ? 0 : t.space.sm }}>
            {/* Wrapper de padding horizontal (NO margen en el card) */}
            <View style={{ paddingHorizontal: t.space.lg, overflow: 'visible' }}>
              <Swipeable
                friction={1.5}
                ref={(ref) => {
                  rowRefs.current[p.id] = ref as any
                }}
                onSwipeableWillOpen={() => onRowWillOpen(p.id)}
                onSwipeableClose={() => {
                  if (openRowId.current === p.id) openRowId.current = null
                }}
                renderLeftActions={() => renderLeftActions(p)}
                leftThreshold={30}
                overshootLeft={false}
                renderRightActions={() => renderRightActions(p)}
                rightThreshold={30}
                overshootRight={false}
                // ✅ Clave: que NO recorte la sombra del child que se mueve
                containerStyle={{ overflow: 'visible' } as any}
              >
                {/* 1) ShadowWrap: aquí va la sombra (este view es el que SE MUEVE) */}
                <View
                  style={{
                    borderRadius: 20,
                    backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                    overflow: 'visible',
        
                    // sombra/elevation aquí (mueve con el swipe)
                    elevation: t.isDark ? 0 : 5,
                    shadowColor: '#000',
                    shadowOpacity: t.isDark ? 0 : 0.10,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 10 },
                  }}
                >
                  {/* 2) ClipWrap: aquí van esquinas + borde + recorte */}
                  <View
                    style={{
                      borderRadius: 20,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: t.colors.border,
                      backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                    }}
                  >
                    <Pressable
                      onLongPress={() => remove(p)}
                      style={({ pressed }) => ({
                        backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                        opacity: pressed ? 0.95 : 1,
                      })}
                    >
                      {/* Accent bar */}
                      <View
                        style={{
                          height: 4,
                          backgroundColor: p.checked_in
                            ? '#22C55E'
                            : hexToRgba(t.colors.border, 0.8),
                        }}
                      />
        
                      <View style={{ padding: t.space.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <AvatarBubble isGuest={!p.user_id} />
        
                        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>
                            {title}
                          </Text>
        
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <MiniChip
                              icon={p.user_id ? 'person-outline' : 'ticket-outline'}
                              label={kind}
                              baseColor={p.user_id ? t.colors.primary : '#8B5CF6'}
                            />
        
                            <MiniChip
                              icon={p.checked_in ? 'checkmark-circle' : 'time-outline'}
                              label={p.checked_in ? 'Check-in' : 'Sin check-in'}
                              baseColor={p.checked_in ? '#22C55E' : '#64748B'}
                            />
        
                            {tournamentPaid ? (
                              <MiniChip
                                icon={isPaid ? 'cash' : 'cash-outline'}
                                label={isPaid ? 'Pagado' : 'Pendiente'}
                                baseColor={isPaid ? '#F59E0B' : '#64748B'}
                              />
                            ) : null}
                          </View>
                        </View>
        
                        <Ionicons name="chevron-forward" size={18} color={t.colors.muted} />
                      </View>
                    </Pressable>
                  </View>
                </View>
              </Swipeable>
            </View>
          </View>
        )
      }}      
      onEndReachedThreshold={0.7}
      onEndReached={loadMore}
    />
  )
}