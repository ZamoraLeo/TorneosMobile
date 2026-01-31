import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '../../../theme/theme'
import {
  getTournamentDetails,
} from '../../../services/tournaments.service'

import type {
  TournamentDetails,
} from '../../../domain/tournaments'

import { hexToRgba } from '../../../utils/colors'

import { ParticipantsTab, StagesTab, ConfigTab, AddParticipantModal } from './tabs'

type Props = { navigation: any; route: any }
type TabKey = 'stages' | 'participants' | 'config'

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
          {tab === 'stages' ? (
            <StagesTab />
          ) : (
            <ConfigTab
              data={data}
              onPressEditConfig={() =>
                navigation.navigate('TournamentConfig', { tournamentId })
              }
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
