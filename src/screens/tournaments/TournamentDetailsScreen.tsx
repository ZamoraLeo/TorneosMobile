import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Swipeable } from 'react-native-gesture-handler'

import { useTheme } from '../../theme/theme'
import {
  addGuestParticipant,
  addUserParticipantByUsername,
  deleteParticipant,
  getTournamentDetails,
  listTournamentParticipants,
  setParticipantCheckIn,
  setParticipantPaid,
  getTournamentParticipantStats
} from '../../services/tournaments.service'

import type {
  TournamentDetails,
  SupportedStageType,
  TournamentParticipantListItem,
} from '../../domain/tournaments'

import { Button, Input } from '../../components/ui'
import { hexToRgba } from '../../utils/colors'

type Props = { navigation: any; route: any }
type TabKey = 'stages' | 'participants' | 'config'

const PAGE_SIZE = 10

function formatDateES(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })
}

function statusLabel(s: TournamentDetails['status']) {
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

function statusColors(t: ReturnType<typeof useTheme>, s: TournamentDetails['status']) {
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

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: t.colors.muted, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: t.colors.text, fontWeight: '800' }}>{value}</Text>
    </View>
  )
}

function TournamentTabs({
  value,
  onChange,
}: {
  value: TabKey
  onChange: (t: TabKey) => void
}) {
  const t = useTheme()

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'stages', label: 'Etapas' },
    { key: 'participants', label: 'Participantes' },
    { key: 'config', label: 'Configuración' },
  ]

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active
                ? hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14)
                : 'transparent',
            }}
          >
            <Text
              style={{
                color: t.colors.text,
                fontWeight: active ? '900' : '700',
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function StagesTab() {
  const t = useTheme()
  return (
    <Card>
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
        Etapas
      </Text>
      <Text style={{ color: t.colors.muted, lineHeight: 20 }}>
        Aquí irá la vista visual de la fase de grupos y la llave (bracket).
        Por ahora lo dejamos listo para más adelante.
      </Text>
    </Card>
  )
}

/**
 * ✅ Modal agregar participante (quick add)
 */
function AddParticipantModal({
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
            <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
              Agregar participante
            </Text>

            <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
              Tip: agrega uno, se limpia el campo, y sigues agregando rápido 🚀
            </Text>

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
  icon,
  bg,
  onPress,
  disabled,
}: {
  icon: string
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
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontSize: 22, fontWeight: '900', color: t.colors.text }}>
        {icon}
      </Text>
    </Pressable>
  )
}

/**
 * ✅ Tab Participantes (Swipe acciones)
 */
function ParticipantsTab({
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

  // ✅ Acciones IZQUIERDA (aparecen al deslizar a la DERECHA 👉)
  // Aquí van: Check-in + Pagado (si aplica)
  const renderLeftActions = useCallback(
    (p: TournamentParticipantListItem) => {
      const checkBg = p.checked_in
        ? hexToRgba('#22C55E', t.isDark ? 0.35 : 0.22)
        : hexToRgba(t.colors.primary, t.isDark ? 0.25 : 0.18)
  
      const paidBg = !!p.paid
        ? hexToRgba('#F59E0B', t.isDark ? 0.35 : 0.22)
        : hexToRgba('#64748B', t.isDark ? 0.35 : 0.20)
  
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
  
            // ✅ esto hace que los botones queden “bien” con el margen del card
            paddingLeft: t.space.lg,
            paddingRight: 10,
          }}
        >
          <SwipeIconButton
            icon={p.checked_in ? '✅' : '☑️'}
            bg={checkBg}
            disabled={busyMap[p.id]}
            onPress={() => {
              closeRow(p.id)
              toggleCheckIn(p)
            }}
          />
  
          {tournamentPaid ? (
            <SwipeIconButton
              icon={p.paid ? '💰' : '💸'}
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

  // ✅ Acciones DERECHA (aparecen al deslizar a la IZQUIERDA 👈)
  // Aquí va: Eliminar
  const renderRightActions = useCallback(
    (p: TournamentParticipantListItem) => {
      const dangerBg = hexToRgba(t.colors.danger, t.isDark ? 0.32 : 0.18)
      const dangerBorder = hexToRgba(t.colors.danger, 0.55)
  
      return (
        // ✅ el contenedor sí mide todo, para que el swipe “abra completo”
        <View
          style={{
            width: '100%',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={() => {
              closeRow(p.id)
              remove(p)
            }}
            style={({ pressed }) => ({
              // ✅ ocupa el alto completo de la fila
              flex: 1,
  
              // ✅ mismo “tamaño visual” que el card
              marginHorizontal: t.space.lg,
              borderRadius: 18,
              padding: t.space.md,
  
              borderWidth: 1,
              borderColor: dangerBorder,
              backgroundColor: dangerBg,
  
              alignItems: 'center',
              justifyContent: 'center',
  
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text
              style={{
                color: t.colors.text,
                fontWeight: '900',
                fontSize: 14,
              }}
            >
              ELIMINAR
            </Text>
  
            <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 11, marginTop: 2 }}>
              (toca para confirmar)
            </Text>
          </Pressable>
        </View>
      )
    },
    [remove, t]
  )

  const header = useMemo(() => {
    return (
      <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.md, paddingBottom: t.space.md }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
                Participantes
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ color: t.colors.muted, fontWeight: '800' }}>
                  👥 Total: {totalCount}
                </Text>

                <Text style={{ color: t.colors.muted, fontWeight: '800' }}>
                  ✅ Check-in: {checkedInCount}
                </Text>

                {tournamentPaid ? (
                  <Text style={{ color: t.colors.muted, fontWeight: '800' }}>
                    💰 Pagados: {paidCount}
                  </Text>
                ) : null}
              </View>

              <Text style={{ color: t.colors.muted, fontWeight: '600', fontSize: 12, marginTop: 4 }}>
                👉 swipe para check-in/pago · 👈 swipe para eliminar
              </Text>
            </View>

            <View style={{ minWidth: 120 }}>
              <Button title="Agregar" onPress={onOpenAddModal} />
            </View>
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
      contentContainerStyle={{ paddingBottom: t.space.lg }}
      renderItem={({ item: p, index }) => {
        const title = p.display_name || p.guest_name || 'Participante'
        const kind = p.user_id ? 'Usuario app' : 'Invitado'
        const isPaid = !!p.paid
      
        return (
          <View style={{ paddingTop: index === 0 ? 0 : t.space.sm }}>
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
            >
              <Pressable
                onLongPress={() => remove(p)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  backgroundColor: t.colors.card,
                  borderRadius: 18,
                  padding: t.space.md,
                  gap: 8,
                  opacity: pressed ? 0.96 : 1,
      
                  // ✅ el margen aquí (NO afuera), para que Swipeable sea full width
                  marginHorizontal: t.space.lg,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 15 }}>
                      {title}
                    </Text>
                    <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                      {kind}
                    </Text>
                  </View>
      
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12 }}>
                      {p.checked_in ? '✅ check-in' : '⏳ sin check-in'}
                    </Text>
      
                    {tournamentPaid ? (
                      <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12 }}>
                        {isPaid ? '💰 pagado' : '💸 pendiente'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Swipeable>
          </View>
        )
      }}
      onEndReachedThreshold={0.7}
      onEndReached={loadMore}
    />
  )
}

function ConfigTab({ data }: { data: TournamentDetails }) {
  const t = useTheme()

  const stageTitles = {
    groups_round_robin: 'Fase 1: Grupos (Round Robin)',
    double_elimination: 'Fase 2: Doble eliminación',
  } satisfies Record<SupportedStageType, string>

  return (
    <View style={{ gap: t.space.md }}>
      <Card>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
          Configuración general
        </Text>

        <Row label="Disciplina" value={(data.settings?.discipline || '—').toString()} />
        <Row label="Entrada" value={data.settings?.paid ? 'Pagado' : 'Gratis'} />
        <Row
          label="Cuota"
          value={
            data.settings?.paid
              ? `${data.settings?.currency || 'MXN'} ${data.settings?.entry_fee ?? 0}`
              : '0'
          }
        />

        <View style={{ height: 1, backgroundColor: t.colors.border, marginTop: 6 }} />

        <Text style={{ color: t.colors.text, fontWeight: '900' }}>
          Formato de match
        </Text>

        <Row label="Sets (best of)" value={`${data.settings?.match_format?.best_of_sets ?? '—'}`} />
        <Row label="Puntos para ganar" value={`${data.settings?.match_format?.points_to_win ?? '—'}`} />
        <Row label="Máximo posible" value={`${data.settings?.match_format?.max_points_possible ?? '—'}`} />
      </Card>

      <View style={{ gap: 10 }}>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
          Etapas (config)
        </Text>

        {data.stages.map((s) => (
          <Card key={`${s.position}-${s.type}`}>
            <Text style={{ color: t.colors.text, fontWeight: '900' }}>
              {stageTitles[s.type] ?? `Etapa ${s.position}`}
            </Text>

            {s.type === 'groups_round_robin' ? (
              <>
                <Row label="Modo grupos" value={s.config.groups.mode || '—'} />
                <Row label="Tamaño por grupo" value={`${s.config.groups.group_size ?? '—'}`} />
                <Row label="Avanzan por grupo" value={`${s.config.groups.advance_per_group ?? '—'}`} />
                <Row label="Enfrentamientos" value={`${s.config.round_robin.games_per_pair ?? 1} vez`} />
              </>
            ) : (
              <>
                <Row label="Permitir BYEs" value={s.config.allow_byes ? 'Sí' : 'No'} />
                <Row label="Final con reset" value={s.config.grand_final_reset ? 'Sí' : 'No'} />
              </>
            )}
          </Card>
        ))}
      </View>
    </View>
  )
}

export function TournamentDetailsScreen({ navigation, route }: Props) {
  const t = useTheme()
  const tournamentId: string = route?.params?.tournamentId

  const [tab, setTab] = useState<TabKey>('participants')

  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [data, setData] = useState<TournamentDetails | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [participantsReloadKey, setParticipantsReloadKey] = useState(0)

  const load = useCallback(async () => {
    setErrorText(null)
    const res = await getTournamentDetails(tournamentId)
    if (!res.ok) {
      setErrorText(res.error?.message || 'No se pudo cargar el torneo.')
      setData(null)
      return
    }
    setData(res.data)
  }, [tournamentId])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  useEffect(() => {
    if (data?.name) navigation.setOptions({ title: data.name })
  }, [data?.name, navigation])

  const tournamentPaid = !!data?.settings?.paid

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator />
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando torneo…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.space.lg, gap: t.space.md }}>
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

        {!data ? null : (
          <>
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '900' }}>
                {data.name}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {(() => {
                  const c = statusColors(t, data.status)
                  return (
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
                      <Text style={{ color: c.text, fontWeight: '900', fontSize: 12 }}>
                        {statusLabel(data.status)}
                      </Text>
                    </View>
                  )
                })()}

                <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                  Creado: {formatDateES(data.created_at)}
                </Text>
              </View>
            </View>

            <TournamentTabs value={tab} onChange={setTab} />
          </>
        )}
      </View>

      {!data ? null : tab === 'participants' ? (
        <>
          <ParticipantsTab
            tournamentId={tournamentId}
            reloadKey={participantsReloadKey}
            onOpenAddModal={() => setModalOpen(true)}
            tournamentPaid={tournamentPaid}
          />

          <AddParticipantModal
            visible={modalOpen}
            onClose={() => setModalOpen(false)}
            tournamentId={tournamentId}
            onAdded={() => setParticipantsReloadKey((x) => x + 1)}
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: t.space.lg,
            paddingBottom: t.space.lg,
            gap: t.space.md,
          }}
        >
          {tab === 'stages' ? <StagesTab /> : <ConfigTab data={data} />}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
