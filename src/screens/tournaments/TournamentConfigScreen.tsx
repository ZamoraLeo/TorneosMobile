import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { Button, HelpTip, Input, Toggle, useToast } from '../../components/ui'
import { hexToRgba } from '../../utils/colors'

import {
  getTournamentDetails,
  replaceTournamentStages,
  updateTournamentSettings,
} from '../../services/tournaments.service'

import type {
  GroupsRoundRobinStage,
  TournamentSettings,
  TournamentStageInput,
} from '../../domain/tournaments'
import { STAGE_TITLES } from '../../domain/tournaments'

type Props = { navigation: any; route: any }

function toInt(v: string, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  accent,
}: {
  title: string
  subtitle?: string
  icon?: string
  children: React.ReactNode
  accent?: string
}) {
  const t = useTheme()
  const a = accent ?? t.colors.primary

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: hexToRgba(t.colors.border, 0.95),
        backgroundColor: t.colors.card,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 3, backgroundColor: a }} />

      <View style={{ padding: t.space.md, gap: 10 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
            {icon ? `${icon}  ` : ''}{title}
          </Text>
          {!!subtitle && (
            <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
              {subtitle}
            </Text>
          )}
        </View>

        {children}
      </View>
    </View>
  )
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  disabled,
  hint,
  validate,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: any
  disabled?: boolean
  hint?: string | null
  validate?: (v: string) => string | null
}) {
  const t = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: t.colors.text, fontWeight: '800' }}>{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={!disabled}
        hint={hint ?? null}
        validate={validate}
        showErrorWhen="touched"
        containerStyle={{ opacity: disabled ? 0.7 : 1 }}
      />
    </View>
  )
}

/**
 * ✅ Animated show/hide: cuota
 * - cambia altura y opacidad
 * - conserva layout sin “saltos” agresivos
 */
function AnimatedCollapse({
  visible,
  children,
}: {
  visible: boolean
  children: React.ReactNode
}) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // height requiere false
    }).start()
  }, [visible, anim])

  const opacity = anim
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 86] })
  const marginTop = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] })

  return (
    <Animated.View style={{ height, opacity, marginTop, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  )
}

export function TournamentConfigScreen({ navigation, route }: Props) {
  const t = useTheme()
  const toast = useToast()

  const tournamentId = route.params?.tournamentId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [settings, setSettings] = useState<TournamentSettings | null>(null)
  const [stages, setStages] = useState<TournamentStageInput[]>([])

  // inputs como strings
  const [entryFee, setEntryFee] = useState('0')
  const [bestOf, setBestOf] = useState('3')
  const [pointsToWin, setPointsToWin] = useState('4')
  const [maxPointsEnabled, setMaxPointsEnabled] = useState(false)
  const [maxPoints, setMaxPoints] = useState('0')
  
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const res = await getTournamentDetails(tournamentId)
      setLoading(false)

      if (!res.ok) {
        toast.error('No se pudo abrir el torneo', res.error?.message || 'Intenta de nuevo.')
        navigation.goBack()
        return
      }

      const d = res.data
      setName(d.name)
      setSettings(d.settings)
      setStages(d.stages.map((s) => ({ position: s.position, type: s.type, config: s.config })) as any)

      setEntryFee(String(d.settings.entry_fee ?? 0))
      setBestOf(String(d.settings.match_format.best_of_sets ?? 3))
      const dbMax = d.settings.match_format.max_points_possible ?? 0
      setMaxPointsEnabled(dbMax !== 0)
      setMaxPoints(String(dbMax))    })()
  }, [tournamentId, navigation, toast])

  useEffect(() => {
    if (!maxPointsEnabled) {
      setMaxPoints('0')
    } else {
      const mx = toInt(maxPoints, 0)
      const win = toInt(pointsToWin, 1)
      if (mx === 0) setMaxPoints(String(win))
    }
  }, [maxPointsEnabled])

  useEffect(() => {
    if (!maxPointsEnabled) return
    const mx = toInt(maxPoints, 0)
    const win = toInt(pointsToWin, 1)
    if (mx !== 0 && mx < win) setMaxPoints(String(win))
  }, [pointsToWin])

  const canSave = useMemo(() => !loading && !saving && !!settings, [loading, saving, settings])

  const validateAll = (next: TournamentSettings, nextStages: TournamentStageInput[]) => {
    if (!next.paid && next.entry_fee !== 0) return 'Si es gratuito, la cuota debe ser 0.'
    if (next.match_format.best_of_sets < 1) return '“Mejor de” debe ser mínimo 1.'
    if (next.match_format.points_to_win < 1) return 'Los puntos para ganar deben ser mínimo 1.'
    const mx = next.match_format.max_points_possible

    // 0 = infinito, no se valida contra points_to_win
    if (mx !== 0 && mx < next.match_format.points_to_win) {
      return 'El máximo de puntos debe ser mayor o igual a “Puntos para ganar” (o 0 para infinito).'
    }
    if (mx < 0) {
      return 'El máximo de puntos no puede ser negativo (usa 0 para infinito).'
    }

    for (const s of nextStages) {
      if (s.type === 'groups_round_robin') {
        const cfg = (s as GroupsRoundRobinStage).config
        if (cfg.groups.group_size < 2) return 'El tamaño del grupo debe ser mínimo 2.'
        if (cfg.groups.advance_per_group < 1) return 'Debe avanzar al menos 1 por grupo.'
        if (cfg.groups.advance_per_group >= cfg.groups.group_size) {
          return 'Los que avanzan deben ser menos que el tamaño del grupo.'
        }
        if (cfg.round_robin.games_per_pair < 1) return 'Debe haber mínimo 1 partida por enfrentamiento.'
      }
    }
    return null
  }

  const updateStage = (position: number, updater: (s: TournamentStageInput) => TournamentStageInput) => {
    setStages((prev) =>
      prev
        .map((s) => (s.position === position ? updater(s) : s))
        .sort((a, b) => a.position - b.position)
    )
  }

  const onSave = async () => {
    if (!settings) return

    const next: TournamentSettings = {
      ...settings,
      entry_fee: settings.paid ? toInt(entryFee, settings.entry_fee) : 0,
      match_format: {
        best_of_sets: toInt(bestOf, settings.match_format.best_of_sets),
        points_to_win: toInt(pointsToWin, settings.match_format.points_to_win),
        max_points_possible: maxPointsEnabled ? toInt(maxPoints, 0) : 0,
      },
    }

    const errText = validateAll(next, stages)
    if (errText) {
      toast.error('Hay algo que ajustar', errText)
      return
    }

    setSaving(true)
    try {
      const sRes = await updateTournamentSettings(tournamentId, next)
      if (!sRes.ok) {
        toast.error('No se guardó la configuración', sRes.error?.message || 'Intenta de nuevo.')
        return
      }

      const stRes = await replaceTournamentStages(tournamentId, stages)
      if (!stRes.ok) {
        toast.error('No se guardaron las etapas', stRes.error?.message || 'Intenta de nuevo.')
        return
      }

      toast.success('Guardado', 'Tu torneo quedó actualizado.')
      navigation.goBack()
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator />
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando configuración…</Text>
        </View>
      </SafeAreaView>
    )
  }

  const paidAccent = settings.paid ? t.colors.primary : hexToRgba(t.colors.border, 1)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={{ padding: t.space.lg, gap: 14, paddingBottom: 34 }}>
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.text, fontSize: 24, fontWeight: '900' }}>
            Ajustes del torneo
          </Text>

          <View
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: hexToRgba(t.colors.primary, 0.35),
              backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.12 : 0.08),
            }}
          >
            <Text style={{ color: t.colors.text, fontWeight: '800' }} numberOfLines={1}>
              🏷️ {name}
            </Text>
          </View>

          <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
            Aquí decides si es gratuito, cuántos puntos se necesitan y cómo avanzan los jugadores.
          </Text>
        </View>

        {/* Pago */}
        <SectionCard
          title="Costo de inscripción"
          subtitle="Actívalo solo si quieres cobrar entrada."
          icon="💳"
          accent={paidAccent}
        >
          <Toggle
            label={settings.paid ? 'Inscripción con costo' : 'Inscripción gratuita'}
            value={settings.paid}
            onChange={(paid) => {
              setSettings((p) => (p ? { ...p, paid } : p))
              if (!paid) setEntryFee('0')
            }}
          />

          <AnimatedCollapse visible={settings.paid}>
            <Field
              label={`Cuota (${settings.currency})`}
              value={entryFee}
              onChangeText={setEntryFee}
              keyboardType="numeric"
              validate={(v) => {
                const n = toInt(v, 0)
                if (n < 0) return 'No puede ser negativo.'
                if (n === 0) return 'Si es con costo, la cuota debería ser mayor a 0.'
                return null
              }}
              hint="Ej. 100"
            />
          </AnimatedCollapse>

          {!settings.paid ? (
            <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
              ✅ Al ser gratuito, todos pueden registrarse sin pagar.
            </Text>
          ) : null}
        </SectionCard>

        {/* Formato */}
        <SectionCard
          title="Reglas del match"
          subtitle="Esto define el ritmo de cada enfrentamiento."
          icon="🎮"
          accent={hexToRgba(t.colors.primary, 1)}
        >
          <Field
            label="Mejor de (sets)"
            value={bestOf}
            onChangeText={setBestOf}
            keyboardType="numeric"
            validate={(v) => (toInt(v, 1) < 1 ? 'Mínimo 1.' : null)}
            hint="Ej. 3 (mejor de 3)"
          />

          <Field
            label="Puntos para ganar"
            value={pointsToWin}
            onChangeText={setPointsToWin}
            keyboardType="numeric"
            validate={(v) => (toInt(v, 1) < 1 ? 'Mínimo 1.' : null)}
            hint="Ej. 4"
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Toggle
                label="Límite máximo de puntos"
                value={maxPointsEnabled}
                onChange={setMaxPointsEnabled}
              />
            </View>

            <HelpTip
              title="¿Para qué sirve?"
              message="Si está apagado, no hay límite (guardamos 0). Si está encendido, el match se corta al llegar al máximo."
            />
          </View>

          {maxPointsEnabled ? (
            <AnimatedCollapse visible={maxPointsEnabled}>
              <Field
                label="Máximo de puntos por match"
                value={maxPoints}
                onChangeText={setMaxPoints}
                keyboardType="numeric"
                validate={(v) => {
                  const mx = toInt(v, 0)
                  const win = toInt(pointsToWin, 1)
                  if (mx < 1) return 'Mínimo 1.'
                  if (mx < win) return 'Debe ser mayor o igual a “Puntos para ganar”.'
                  return null
                }}
                hint="Evita matches eternos 😄"
              />
            </AnimatedCollapse>
          ) : (
            <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
              Sin límite (infinito).
            </Text>
          )}
        </SectionCard>

        {/* Etapas */}
        <SectionCard
          title="Etapas del torneo"
          subtitle="Ajusta el tamaño de grupos y reglas de eliminación."
          icon="🧩"
          accent={hexToRgba('#3B82F6', 1)}
        >
          {stages.map((s) => {
            const stageAccent =
              s.type === 'groups_round_robin'
                ? hexToRgba(t.colors.primary, 1)
                : hexToRgba(t.colors.danger, 1)

            return (
              <View
                key={`${s.position}-${s.type}`}
                style={{
                  borderWidth: 1,
                  borderColor: hexToRgba(t.colors.border, 0.95),
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: hexToRgba(t.colors.bg, t.isDark ? 0.02 : 0.6),
                }}
              >
                <View style={{ height: 3, backgroundColor: stageAccent }} />
                <View style={{ padding: t.space.md, gap: 10 }}>
                  <Text style={{ color: t.colors.text, fontWeight: '900' }}>
                    {STAGE_TITLES[s.type]}
                  </Text>

                  {s.type === 'groups_round_robin' ? (
                    <>
                      <Field
                        label="Jugadores por grupo"
                        value={String((s as any).config.groups.group_size)}
                        keyboardType="numeric"
                        onChangeText={(v) =>
                          updateStage(s.position, (prev) => ({
                            ...prev,
                            config: {
                              ...(prev as any).config,
                              groups: {
                                ...(prev as any).config.groups,
                                group_size: toInt(v, (prev as any).config.groups.group_size),
                              },
                            },
                          }))
                        }
                        validate={(txt) => {
                          const size = toInt(txt, 2)
                          if (size < 2) return 'Mínimo 2.'
                          return null
                        }}
                        hint="Ej. 4"
                      />

                      <Field
                        label="Cuántos avanzan"
                        value={String((s as any).config.groups.advance_per_group)}
                        keyboardType="numeric"
                        onChangeText={(v) =>
                          updateStage(s.position, (prev) => ({
                            ...prev,
                            config: {
                              ...(prev as any).config,
                              groups: {
                                ...(prev as any).config.groups,
                                advance_per_group: toInt(v, (prev as any).config.groups.advance_per_group),
                              },
                            },
                          }))
                        }
                        validate={(txt) => {
                          const adv = toInt(txt, 1)
                          const size = (s as any).config.groups.group_size
                          if (adv < 1) return 'Mínimo 1.'
                          if (adv >= size) return 'Debe ser menor que “Jugadores por grupo”.'
                          return null
                        }}
                        hint="Ej. 2"
                      />

                      <Field
                        label="Partidas por enfrentamiento"
                        value={String((s as any).config.round_robin.games_per_pair)}
                        keyboardType="numeric"
                        onChangeText={(v) =>
                          updateStage(s.position, (prev) => ({
                            ...prev,
                            config: {
                              ...(prev as any).config,
                              round_robin: {
                                ...(prev as any).config.round_robin,
                                games_per_pair: toInt(v, (prev as any).config.round_robin.games_per_pair),
                              },
                            },
                          }))
                        }
                        validate={(txt) => (toInt(txt, 1) < 1 ? 'Mínimo 1.' : null)}
                        hint="Ej. 1"
                      />
                    </>
                  ) : null}

                  {s.type === 'double_elimination' ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Toggle
                            label="Permitir byes"
                            value={(s as any).config.allow_byes}
                            onChange={(next) =>
                              updateStage(s.position, (prev) => ({
                                ...prev,
                                config: { ...(prev as any).config, allow_byes: next },
                              }))
                            }
                          />
                        </View>

                        <HelpTip
                          title="¿Qué es un bye?"
                          message="Un bye es un pase automático cuando falta un jugador para completar el bracket. Sirve para que el formato siga funcionando sin romper emparejamientos."
                        />
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Toggle
                            label="Reset en gran final"
                            value={(s as any).config.grand_final_reset}
                            onChange={(next) =>
                              updateStage(s.position, (prev) => ({
                                ...prev,
                                config: { ...(prev as any).config, grand_final_reset: next },
                              }))
                            }
                          />
                        </View>

                        <HelpTip
                          title="Reset en gran final"
                          message="Si el jugador invicto pierde la primera final, se juega una segunda final para decidir el campeón. Esto es estándar en doble eliminación."
                        />
                      </View>
                      <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
                        Tip: Doble eliminación le da una segunda oportunidad a todos.
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            )
          })}
        </SectionCard>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Volver"
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={saving}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={saving ? 'Guardando…' : 'Guardar cambios'}
              onPress={onSave}
              loading={saving}
              disabled={!canSave}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
