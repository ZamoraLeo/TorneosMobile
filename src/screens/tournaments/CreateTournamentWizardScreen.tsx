import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/theme'
import { Button, Input, Toggle, HelpTip, useToast } from '../../components/ui'
import { hexToRgba } from '../../utils/colors'

import {
  getTournamentDetails,
  replaceTournamentStages,
  updateTournamentSettings
} from '../../services/tournaments.service'

import type {
  TournamentSettings,
  TournamentStageInput,
  SupportedStageType,
  GroupsRoundRobinConfig,
  DoubleEliminationConfig,
} from '../../domain/tournaments'

import {
  DEFAULT_TOURNAMENT_SETTINGS,
  DEFAULT_GROUPS_RR_CONFIG,
  DEFAULT_DOUBLE_ELIM_CONFIG,
  STAGE_TITLES,
} from '../../domain/tournaments'

type Props = { navigation: any; route: any }

type StepKey =
  | 'pay'
  | 'discipline'
  | 'match'
  | 'stages'
  | 'stage1'
  | 'stage2'
  | 'extras'
  | 'summary'

const STEPS: { key: StepKey; title: string; subtitle: string; icon: string }[] = [
  { key: 'pay', title: 'Costo', subtitle: '¿Gratuito o con inscripción?', icon: '💳' },
  { key: 'discipline', title: 'Disciplina', subtitle: 'Define el tipo de torneo', icon: '🎯' },
  { key: 'match', title: 'Reglas', subtitle: 'Cómo se gana un match', icon: '🎮' },
  { key: 'stages', title: 'Etapas', subtitle: 'Cuántas etapas y de qué tipo', icon: '🧩' },
  { key: 'stage1', title: 'Etapa 1', subtitle: 'Configura la primera etapa', icon: '①' },
  { key: 'stage2', title: 'Etapa 2', subtitle: 'Configura la segunda etapa', icon: '②' },
  { key: 'extras', title: 'Detalles', subtitle: 'Opciones extra (opcional)', icon: '✨' },
  { key: 'summary', title: 'Resumen', subtitle: 'Revisa y crea el torneo', icon: '✅' },
]

function toInt(v: string, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function SectionCard({
  title,
  subtitle,
  icon,
  accent,
  children,
}: {
  title: string
  subtitle?: string
  icon?: string
  accent?: string
  children: React.ReactNode
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

function ProgressPills({ idx }: { idx: number }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => {
        const active = i === idx
        const done = i < idx
        const bg = active
          ? hexToRgba(t.colors.primary, t.isDark ? 0.16 : 0.10)
          : done
            ? hexToRgba(t.colors.primary, t.isDark ? 0.10 : 0.06)
            : hexToRgba(t.colors.border, t.isDark ? 0.12 : 0.10)

        const border = active || done
          ? hexToRgba(t.colors.primary, 0.35)
          : hexToRgba(t.colors.border, 0.95)

        return (
          <View
            key={s.key}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: bg,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }}>
              {s.icon}
            </Text>
            <Text style={{ color: t.colors.text, fontWeight: '800', fontSize: 12 }}>
              {s.title}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function AnimatedCollapse({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
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

function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  right,
}: {
  title: string
  subtitle?: string
  selected: boolean
  onPress: () => void
  right?: React.ReactNode
}) {
  const t = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? hexToRgba(t.colors.primary, 0.55) : hexToRgba(t.colors.border, 0.95),
        backgroundColor: selected
          ? hexToRgba(t.colors.primary, t.isDark ? 0.14 : 0.10)
          : hexToRgba(t.colors.bg, t.isDark ? 0.02 : 0.6),
        borderRadius: 16,
        padding: 12,
        gap: 4,
        opacity: pressed ? 0.92 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: t.colors.text, fontWeight: '900' }}>{title}</Text>
        {!!subtitle && (
          <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {right ?? null}
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? t.colors.primary : hexToRgba(t.colors.muted, 0.7),
            backgroundColor: selected ? t.colors.primary : 'transparent',
          }}
        />
      </View>
    </Pressable>
  )
}

export function CreateTournamentWizardScreen({ navigation, route }: Props) {
  const t = useTheme()
  const toast = useToast()
  const tournamentId = route.params?.tournamentId as string

  // nombre viene desde la pantalla anterior (si quieres)
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEPS[stepIdx]

  // animación de transición entre pasos
  const a = useRef(new Animated.Value(1)).current
  const x = useRef(new Animated.Value(0)).current

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // ========= Estado del wizard =========
  const [name, setName] = useState('')

  const [settings, setSettings] = useState<TournamentSettings>(() => ({
    ...DEFAULT_TOURNAMENT_SETTINGS,
  }))

  // Pago
  const [entryFee, setEntryFee] = useState('0')

  // Disciplina (por ahora solo beyblade_x, pero lista lista para crecer)
  const DISCIPLINES = useMemo(() => {
    return [
      { key: 'beyblade_x', label: 'Beyblade X', desc: 'Reglas y formatos para Beyblade X' },
      // luego agregas aquí otras
    ] as const
  }, [])

  // Reglas match
  const [bestOf, setBestOf] = useState(String(DEFAULT_TOURNAMENT_SETTINGS.match_format.best_of_sets))
  const [pointsToWin, setPointsToWin] = useState(String(DEFAULT_TOURNAMENT_SETTINGS.match_format.points_to_win))

  // max points optional: si está apagado, max_points_possible = 0 (infinito)
  const [maxPointsEnabled, setMaxPointsEnabled] = useState(false)
  const [maxPoints, setMaxPoints] = useState('0')

  // Etapas
  const [stageCount, setStageCount] = useState<1 | 2>(2)
  const [stage1Type, setStage1Type] = useState<SupportedStageType>('groups_round_robin')
  const [stage2Type, setStage2Type] = useState<SupportedStageType>('double_elimination')

  const [stage1Cfg, setStage1Cfg] = useState<GroupsRoundRobinConfig | DoubleEliminationConfig>(() => ({
    ...DEFAULT_GROUPS_RR_CONFIG,
  }))

  const [stage2Cfg, setStage2Cfg] = useState<GroupsRoundRobinConfig | DoubleEliminationConfig>(() => ({
    ...DEFAULT_DOUBLE_ELIM_CONFIG,
  }))

  // Detalles extra (placeholder sin tocar DB, para que luego lo conectes)
  const [notes, setNotes] = useState('')

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
  
      // settings base
      setSettings(d.settings)
  
      // pago
      setEntryFee(String(d.settings.entry_fee ?? 0))
  
      // match
      setBestOf(String(d.settings.match_format.best_of_sets ?? DEFAULT_TOURNAMENT_SETTINGS.match_format.best_of_sets))
      setPointsToWin(String(d.settings.match_format.points_to_win ?? DEFAULT_TOURNAMENT_SETTINGS.match_format.points_to_win))
  
      const dbMax = d.settings.match_format.max_points_possible ?? 0
      setMaxPointsEnabled(dbMax !== 0)
      setMaxPoints(String(dbMax))
  
      // stages
      const st = d.stages
        .map((s) => ({ position: s.position, type: s.type, config: s.config })) as any as TournamentStageInput[]
  
      setStageCount((st.length >= 2 ? 2 : 1) as 1 | 2)
  
      const s1 = st.find((x) => x.position === 1)
      const s2 = st.find((x) => x.position === 2)
  
      if (s1) {
        setStage1Type(s1.type)
        setStage1Cfg(s1.config as any)
      } else {
        setStage1Type('groups_round_robin')
        setStage1Cfg({ ...DEFAULT_GROUPS_RR_CONFIG })
      }
  
      if (s2) {
        setStage2Type(s2.type)
        setStage2Cfg(s2.config as any)
      } else {
        setStage2Type('double_elimination')
        setStage2Cfg({ ...DEFAULT_DOUBLE_ELIM_CONFIG })
      }
    })()
  }, [tournamentId, navigation, toast])
  

  // ========= Helpers =========
  const goStep = (nextIdx: number, dir: 1 | -1) => {
    Animated.parallel([
      Animated.timing(a, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(x, { toValue: dir * -12, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStepIdx(nextIdx)
      x.setValue(dir * 12)
      Animated.parallel([
        Animated.timing(a, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start()
    })
  }

  const canGoBack = stepIdx > 0
  const canGoNext = stepIdx < STEPS.length - 1

  const onBack = () => {
    if (!canGoBack) return
    goStep(stepIdx - 1, -1)
  }

  // Validación por paso (simple, clara, sin bloquear de más)
  const validateCurrentStep = (): string | null => {
    if (step.key === 'pay') {
      if (settings.paid) {
        const fee = toInt(entryFee, 0)
        if (fee <= 0) return 'Si es con inscripción, la cuota debe ser mayor a 0.'
      }
    }

    if (step.key === 'match') {
      const bo = toInt(bestOf, 1)
      const ptw = toInt(pointsToWin, 1)
      if (bo < 1) return '“Mejor de” debe ser mínimo 1.'
      if (ptw < 1) return 'Puntos para ganar debe ser mínimo 1.'
      if (maxPointsEnabled) {
        const mx = toInt(maxPoints, 0)
        if (mx < ptw) return 'El máximo de puntos debe ser mayor o igual a “Puntos para ganar”.'
      }
    }

    if (step.key === 'stages') {
      // nada fuerte aquí
    }

    if (step.key === 'stage1') {
      if (stage1Type === 'groups_round_robin') {
        const cfg = stage1Cfg as GroupsRoundRobinConfig
        if (cfg.groups.group_size < 2) return 'Etapa 1: mínimo 2 jugadores por grupo.'
        if (cfg.groups.advance_per_group < 1) return 'Etapa 1: debe avanzar al menos 1.'
        if (cfg.groups.advance_per_group >= cfg.groups.group_size) return 'Etapa 1: los que avanzan deben ser menos que el tamaño del grupo.'
      }
    }

    if (step.key === 'stage2' && stageCount === 2) {
      if (stage2Type === 'groups_round_robin') {
        const cfg = stage2Cfg as GroupsRoundRobinConfig
        if (cfg.groups.group_size < 2) return 'Etapa 2: mínimo 2 jugadores por grupo.'
        if (cfg.groups.advance_per_group < 1) return 'Etapa 2: debe avanzar al menos 1.'
        if (cfg.groups.advance_per_group >= cfg.groups.group_size) return 'Etapa 2: los que avanzan deben ser menos que el tamaño del grupo.'
      }
    }

    return null
  }

  const onNext = () => {
    const err = validateCurrentStep()
    if (err) {
      toast.error('Falta ajustar algo', err)
      return
    }

    // saltos inteligentes: si solo 1 etapa, brinca stage2
    if (step.key === 'stage1' && stageCount === 1) {
      const idx = STEPS.findIndex((s) => s.key === 'extras')
      goStep(idx, 1)
      return
    }

    if (!canGoNext) return
    goStep(stepIdx + 1, 1)
  }

  // Reacciona a toggles con animación/cambios de valores
  useEffect(() => {
    if (!settings.paid) setEntryFee('0')
  }, [settings.paid])

  useEffect(() => {
    if (!maxPointsEnabled) setMaxPoints('0')
    if (maxPointsEnabled && toInt(maxPoints, 0) === 0) setMaxPoints(pointsToWin)
  }, [maxPointsEnabled])

  // Cuando cambias tipo de etapa, resetea config al default del tipo
  useEffect(() => {
    setStage1Cfg(stage1Type === 'groups_round_robin' ? { ...DEFAULT_GROUPS_RR_CONFIG } : { ...DEFAULT_DOUBLE_ELIM_CONFIG })
  }, [stage1Type])

  useEffect(() => {
    setStage2Cfg(stage2Type === 'groups_round_robin' ? { ...DEFAULT_GROUPS_RR_CONFIG } : { ...DEFAULT_DOUBLE_ELIM_CONFIG })
  }, [stage2Type])

  const computedSettings: TournamentSettings = useMemo(() => {
    const paid = settings.paid
    const fee = paid ? toInt(entryFee, settings.entry_fee) : 0

    const bo = clampInt(toInt(bestOf, settings.match_format.best_of_sets), 1, 99)
    const ptw = clampInt(toInt(pointsToWin, settings.match_format.points_to_win), 1, 999)

    const mx = maxPointsEnabled ? clampInt(toInt(maxPoints, 0), 0, 9999) : 0

    return {
      ...settings,
      entry_fee: fee,
      match_format: {
        best_of_sets: bo,
        points_to_win: ptw,
        max_points_possible: mx, // ✅ 0 = sin límite (según tu nueva idea)
      },
    }
  }, [settings, entryFee, bestOf, pointsToWin, maxPointsEnabled, maxPoints])

  const computedStages: TournamentStageInput[] = useMemo(() => {
    const s1: TournamentStageInput = {
      position: 1,
      type: stage1Type,
      config: stage1Cfg as any,
    }

    if (stageCount === 1) return [s1]

    const s2: TournamentStageInput = {
      position: 2,
      type: stage2Type,
      config: stage2Cfg as any,
    }

    return [s1, s2]
  }, [stageCount, stage1Type, stage2Type, stage1Cfg, stage2Cfg])

  const saveWizard = async () => {
    const err = validateCurrentStep()
    if (err) {
      toast.error('Falta ajustar algo', err)
      return
    }
  
    setCreating(true)
    try {
      const sRes = await updateTournamentSettings(tournamentId, computedSettings)
      if (!sRes.ok) {
        toast.error('No se guardó la configuración', sRes.error?.message || 'Intenta de nuevo.')
        return
      }
  
      const stRes = await replaceTournamentStages(tournamentId, computedStages)
      if (!stRes.ok) {
        toast.error('No se guardaron las etapas', stRes.error?.message || 'Intenta de nuevo.')
        return
      }
  
      toast.success('Listo', 'Torneo configurado.')
      navigation.replace('TournamentDetails', { tournamentId })
    } finally {
      setCreating(false)
    }
  }

  // ========= UI por paso =========

  const content = useMemo(() => {
    if (step.key === 'pay') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Costo de inscripción"
            subtitle="Si es gratuito, ocultamos la cuota."
            icon="💳"
            accent={settings.paid ? t.colors.primary : hexToRgba(t.colors.border, 1)}
          >
            <Toggle
              label={settings.paid ? 'Inscripción con costo' : 'Inscripción gratuita'}
              value={settings.paid}
              onChange={(paid) => setSettings((p) => ({ ...p, paid }))}
            />

            <AnimatedCollapse visible={settings.paid}>
              <Input
                value={entryFee}
                onChangeText={setEntryFee}
                keyboardType="numeric"
                placeholder={`Cuota (${settings.currency})`}
                hint="Ej. 100"
                validate={(v) => {
                  const n = toInt(v, 0)
                  if (n <= 0) return 'Debe ser mayor a 0.'
                  return null
                }}
                showErrorWhen="touched"
              />
            </AnimatedCollapse>
          </SectionCard>
        </View>
      )
    }

    if (step.key === 'discipline') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Disciplina"
            subtitle="Esto te permite cambiar lógica en el futuro según el juego/deporte."
            icon="🎯"
            accent={t.colors.primary}
          >
            {DISCIPLINES.map((d) => (
              <OptionCard
                key={d.key}
                title={d.label}
                subtitle={d.desc}
                selected={settings.discipline === d.key}
                onPress={() => setSettings((p) => ({ ...p, discipline: d.key }))}
              />
            ))}
          </SectionCard>
        </View>
      )
    }

    if (step.key === 'match') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Reglas del match"
            subtitle="Define cómo se gana un enfrentamiento."
            icon="🎮"
            accent={t.colors.primary}
          >
            <View style={{ gap: 10 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: t.colors.text, fontWeight: '800' }}>Mejor de (sets)</Text>
                <Input
                  value={bestOf}
                  onChangeText={setBestOf}
                  keyboardType="numeric"
                  hint="Ej. 3 (mejor de 3)"
                  validate={(v) => (toInt(v, 1) < 1 ? 'Mínimo 1.' : null)}
                  showErrorWhen="touched"
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ color: t.colors.text, fontWeight: '800' }}>Puntos para ganar</Text>
                <Input
                  value={pointsToWin}
                  onChangeText={setPointsToWin}
                  keyboardType="numeric"
                  hint="Ej. 4"
                  validate={(v) => (toInt(v, 1) < 1 ? 'Mínimo 1.' : null)}
                  showErrorWhen="touched"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Toggle
                    label="Límite máximo de puntos"
                    value={maxPointsEnabled}
                    onChange={(v) => setMaxPointsEnabled(v)}
                  />
                </View>
                <HelpTip
                  title="Máximo de puntos"
                  message="Si lo desactivas, el match no tiene límite (guardamos 0). Si lo activas, fuerzas un tope para evitar matches muy largos."
                />
              </View>

              <AnimatedCollapse visible={maxPointsEnabled}>
                <Input
                  value={maxPoints}
                  onChangeText={setMaxPoints}
                  keyboardType="numeric"
                  placeholder="Máximo de puntos"
                  hint="Debe ser >= Puntos para ganar"
                  validate={(v) => {
                    const mx = toInt(v, 0)
                    const win = toInt(pointsToWin, 1)
                    if (mx < win) return 'Debe ser mayor o igual a “Puntos para ganar”.'
                    return null
                  }}
                  showErrorWhen="touched"
                />
              </AnimatedCollapse>
            </View>
          </SectionCard>
        </View>
      )
    }

    if (step.key === 'stages') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Número de etapas"
            subtitle="Puedes hacer un torneo simple o con dos fases."
            icon="🧩"
            accent={hexToRgba('#3B82F6', 1)}
          >
            <View style={{ gap: 10 }}>
              <OptionCard
                title="1 etapa"
                subtitle="Rápido y directo."
                selected={stageCount === 1}
                onPress={() => setStageCount(1)}
              />
              <OptionCard
                title="2 etapas"
                subtitle="Ej. Grupos → Doble eliminación."
                selected={stageCount === 2}
                onPress={() => setStageCount(2)}
              />
            </View>
          </SectionCard>

          <SectionCard
            title="Tipo de etapa"
            subtitle="Elige el formato para cada etapa."
            icon="🧠"
            accent={t.colors.primary}
          >
            <Text style={{ color: t.colors.text, fontWeight: '900' }}>Etapa 1</Text>
            <View style={{ gap: 10 }}>
              <OptionCard
                title="Grupos (Round Robin)"
                subtitle="Todos juegan contra todos dentro de su grupo."
                selected={stage1Type === 'groups_round_robin'}
                onPress={() => setStage1Type('groups_round_robin')}
              />
              <OptionCard
                title="Doble eliminación"
                subtitle="Tienes una segunda oportunidad si pierdes."
                selected={stage1Type === 'double_elimination'}
                onPress={() => setStage1Type('double_elimination')}
              />
            </View>

            {stageCount === 2 ? (
              <>
                <View style={{ height: 10 }} />
                <Text style={{ color: t.colors.text, fontWeight: '900' }}>Etapa 2</Text>
                <View style={{ gap: 10 }}>
                  <OptionCard
                    title="Grupos (Round Robin)"
                    subtitle="Todos juegan contra todos dentro de su grupo."
                    selected={stage2Type === 'groups_round_robin'}
                    onPress={() => setStage2Type('groups_round_robin')}
                  />
                  <OptionCard
                    title="Doble eliminación"
                    subtitle="Tienes una segunda oportunidad si pierdes."
                    selected={stage2Type === 'double_elimination'}
                    onPress={() => setStage2Type('double_elimination')}
                  />
                </View>
              </>
            ) : null}
          </SectionCard>
        </View>
      )
    }

    const renderGroupsConfig = (
      cfg: GroupsRoundRobinConfig,
      setCfg: (next: GroupsRoundRobinConfig) => void,
      label: string
    ) => {
      return (
        <SectionCard
          title={label}
          subtitle="Ajusta el tamaño de grupos y cuántos avanzan."
          icon="👥"
          accent={t.colors.primary}
        >
          <View style={{ gap: 10 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: t.colors.text, fontWeight: '800' }}>Jugadores por grupo</Text>
              <Input
                value={String(cfg.groups.group_size)}
                onChangeText={(v) => setCfg({ ...cfg, groups: { ...cfg.groups, group_size: clampInt(toInt(v, cfg.groups.group_size), 2, 64) } })}
                keyboardType="numeric"
                hint="Ej. 4"
                validate={(v) => (toInt(v, 2) < 2 ? 'Mínimo 2.' : null)}
                showErrorWhen="touched"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: t.colors.text, fontWeight: '800' }}>Avanzan por grupo</Text>
              <Input
                value={String(cfg.groups.advance_per_group)}
                onChangeText={(v) => setCfg({ ...cfg, groups: { ...cfg.groups, advance_per_group: clampInt(toInt(v, cfg.groups.advance_per_group), 1, 63) } })}
                keyboardType="numeric"
                hint="Ej. 2"
                validate={(v) => {
                  const adv = toInt(v, 1)
                  if (adv < 1) return 'Mínimo 1.'
                  if (adv >= cfg.groups.group_size) return 'Debe ser menor que “Jugadores por grupo”.'
                  return null
                }}
                showErrorWhen="touched"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: t.colors.text, fontWeight: '800' }}>Partidas por enfrentamiento</Text>
              <Input
                value={String(cfg.round_robin.games_per_pair)}
                onChangeText={(v) => setCfg({ ...cfg, round_robin: { ...cfg.round_robin, games_per_pair: clampInt(toInt(v, cfg.round_robin.games_per_pair), 1, 20) } })}
                keyboardType="numeric"
                hint="Ej. 1"
                validate={(v) => (toInt(v, 1) < 1 ? 'Mínimo 1.' : null)}
                showErrorWhen="touched"
              />
            </View>
          </View>
        </SectionCard>
      )
    }

    const renderDoubleElimConfig = (
      cfg: DoubleEliminationConfig,
      setCfg: (next: DoubleEliminationConfig) => void,
      label: string
    ) => {
      return (
        <SectionCard
          title={label}
          subtitle="Ajustes clave del bracket."
          icon="🏁"
          accent={hexToRgba('#EF4444', 1)}
        >
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Toggle
                  label="Permitir byes"
                  value={cfg.allow_byes}
                  onChange={(v) => setCfg({ ...cfg, allow_byes: v })}
                />
              </View>
              <HelpTip
                title="¿Qué es un bye?"
                message="Un bye es un pase automático cuando falta un jugador para completar el bracket. Evita que se rompa el formato."
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Toggle
                  label="Reset en gran final"
                  value={cfg.grand_final_reset}
                  onChange={(v) => setCfg({ ...cfg, grand_final_reset: v })}
                />
              </View>
              <HelpTip
                title="Reset en gran final"
                message="Si el invicto pierde la primera final, se juega otra final para decidir al campeón. Es común en doble eliminación."
              />
            </View>
          </View>
        </SectionCard>
      )
    }

    if (step.key === 'stage1') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Etapa 1"
            subtitle={STAGE_TITLES[stage1Type]}
            icon="①"
            accent={t.colors.primary}
          >
            <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
              Tipo: <Text style={{ color: t.colors.text, fontWeight: '900' }}>{stage1Type}</Text>
            </Text>
          </SectionCard>

          {stage1Type === 'groups_round_robin'
            ? renderGroupsConfig(stage1Cfg as GroupsRoundRobinConfig, (n) => setStage1Cfg(n), 'Configuración de grupos')
            : renderDoubleElimConfig(stage1Cfg as DoubleEliminationConfig, (n) => setStage1Cfg(n), 'Configuración de doble eliminación')}
        </View>
      )
    }

    if (step.key === 'stage2') {
      if (stageCount === 1) {
        return (
          <SectionCard
            title="Etapa 2"
            subtitle="No aplica porque elegiste 1 etapa."
            icon="②"
            accent={hexToRgba(t.colors.border, 1)}
          >
            <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
              Este paso se omite automáticamente.
            </Text>
          </SectionCard>
        )
      }

      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Etapa 2"
            subtitle={STAGE_TITLES[stage2Type]}
            icon="②"
            accent={t.colors.primary}
          >
            <Text style={{ color: t.colors.muted, fontWeight: '600' }}>
              Tipo: <Text style={{ color: t.colors.text, fontWeight: '900' }}>{stage2Type}</Text>
            </Text>
          </SectionCard>

          {stage2Type === 'groups_round_robin'
            ? renderGroupsConfig(stage2Cfg as GroupsRoundRobinConfig, (n) => setStage2Cfg(n), 'Configuración de grupos')
            : renderDoubleElimConfig(stage2Cfg as DoubleEliminationConfig, (n) => setStage2Cfg(n), 'Configuración de doble eliminación')}
        </View>
      )
    }

    if (step.key === 'extras') {
      return (
        <View style={{ gap: 14 }}>
          <SectionCard
            title="Detalles extra"
            subtitle="Opcional. Puedes dejarlo vacío."
            icon="✨"
            accent={hexToRgba('#A855F7', 1)}
          >
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas del torneo (opcional)"
              hint="Más adelante puedes guardarlo en DB si lo agregas al schema."
            />
          </SectionCard>
        </View>
      )
    }

    // summary
    return (
      <View style={{ gap: 14 }}>
        <SectionCard
          title="Resumen"
          subtitle="Si todo se ve bien, crea el torneo."
          icon="✅"
          accent={t.colors.primary}
        >
          <View style={{ gap: 10 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Nombre</Text>
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>{name.trim() || '—'}</Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Costo</Text>
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>
                {computedSettings.paid ? `Con costo (${computedSettings.currency} ${computedSettings.entry_fee})` : 'Gratuito'}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Disciplina</Text>
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>{computedSettings.discipline}</Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Reglas</Text>
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>
                Mejor de {computedSettings.match_format.best_of_sets} · Gana con {computedSettings.match_format.points_to_win} puntos ·
                {computedSettings.match_format.max_points_possible === 0
                  ? ' Sin límite'
                  : ` Máx ${computedSettings.match_format.max_points_possible}`}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Etapas</Text>
              {computedStages.map((s) => (
                <Text key={s.position} style={{ color: t.colors.text, fontWeight: '900' }}>
                  {s.position}. {STAGE_TITLES[s.type as SupportedStageType]}
                </Text>
              ))}
            </View>

            {!!notes.trim() && (
              <View style={{ gap: 4 }}>
                <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Notas</Text>
                <Text style={{ color: t.colors.text, fontWeight: '800' }}>{notes.trim()}</Text>
              </View>
            )}
          </View>
        </SectionCard>

        <Button
          title={creating ? 'Creando torneo…' : 'Crear torneo'}
          onPress={saveWizard}
          disabled={creating}
          loading={creating}
        />
      </View>
    )
  }, [
    step.key,
    t,
    name,
    settings,
    entryFee,
    DISCIPLINES,
    bestOf,
    pointsToWin,
    maxPointsEnabled,
    maxPoints,
    stageCount,
    stage1Type,
    stage2Type,
    stage1Cfg,
    stage2Cfg,
    notes,
    computedSettings,
    computedStages,
    creating,
  ])

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator />
          <Text style={{ color: t.colors.muted, fontWeight: '700' }}>Cargando torneo…</Text>
        </View>
      </SafeAreaView>
    )
  }  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={{ padding: t.space.lg, gap: 14, paddingBottom: 34 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.text, fontSize: 24, fontWeight: '900' }}>
            Crear torneo
          </Text>

          {!!name && (
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
              <Text style={{ color: t.colors.text, fontWeight: '900' }}>🏷️ {name}</Text>
            </View>
          )}

          <Text style={{ color: t.colors.muted, fontWeight: '600', lineHeight: 18 }}>
            Paso {stepIdx + 1} de {STEPS.length}: {step.icon} {step.title}
          </Text>

          <ProgressPills idx={stepIdx} />
        </View>

        <Animated.View style={{ opacity: a, transform: [{ translateX: x }] }}>
          {content}
        </Animated.View>

        {/* Footer nav */}
        {step.key !== 'summary' ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Atrás"
                variant="ghost"
                onPress={onBack}
                disabled={!canGoBack || creating}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Button
                title="Siguiente"
                onPress={onNext}
                disabled={!canGoNext || creating}
              />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 2 }}>
            <Button
              title="Atrás"
              variant="ghost"
              onPress={onBack}
              disabled={!canGoBack || creating}
            />
          </View>
        )}

        {/* Cancel */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            alignSelf: 'center',
            marginTop: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: t.colors.muted, fontWeight: '800' }}>
            Cancelar creación
          </Text>
        </Pressable>

        {creating ? (
          <View style={{ alignItems: 'center', marginTop: 8, gap: 8 }}>
            <ActivityIndicator />
            <Text style={{ color: t.colors.muted, fontWeight: '700' }}>
              Guardando en Supabase…
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
