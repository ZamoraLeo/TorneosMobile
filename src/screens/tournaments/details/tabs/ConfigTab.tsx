import React, { useMemo, useState } from 'react'
import {
  Pressable,
  Text,
  View,
} from 'react-native'

import { useTheme } from '../../../../theme/theme'

import type {
  TournamentDetails,
  SupportedStageType,
} from '../../../../domain/tournaments'

import { Button } from '../../../../components/ui'
import { hexToRgba } from '../../../../utils/colors'

import Ionicons from '@react-native-vector-icons/ionicons'

function formatMoney(currency: string | null | undefined, amount: number | null | undefined) {
  const cur = currency || 'MXN'
  const a = Number.isFinite(amount as any) ? Number(amount) : 0
  return `${cur} ${a}`
}

function Surface({
  children,
  accent,
}: {
  children: React.ReactNode
  accent?: string
}) {
  const t = useTheme()
  const bg = t.isDark ? t.colors.card : '#FFFFFF'
  return (
    <View
      style={{
        borderRadius: 22,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: t.isDark ? 0.28 : 0.10,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        backgroundColor: 'transparent',
      }}
    >
      <View style={{ borderRadius: 22, overflow: 'hidden' }}>
        {accent ? <View style={{ height: 4, backgroundColor: accent }} /> : null}
        <View
          style={{
            backgroundColor: bg,
            borderWidth: 1,
            borderColor: t.isDark ? t.colors.border : hexToRgba(t.colors.border, 0.9),
          }}
        >
          {children}
        </View>
      </View>
    </View>
  )
}

function Pill({
  icon,
  text,
  tone = 'neutral',
}: {
  icon: string
  text: string
  tone?: 'neutral' | 'primary' | 'danger' | 'info'
}) {
  const t = useTheme()
  const base =
    tone === 'primary'
      ? t.colors.primary
      : tone === 'danger'
        ? t.colors.danger
        : tone === 'info'
          ? '#3B82F6'
          : t.colors.border

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: hexToRgba(base, 0.45),
        backgroundColor: hexToRgba(base, t.isDark ? 0.16 : 0.10),
      }}
    >
      <Ionicons name={icon as any} size={14} color={t.colors.text} />
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}

function StatTile({
  icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: string
  label: string
  value: string
  accent: string
  sub?: string | null
}) {
  const t = useTheme()
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: t.isDark ? t.colors.border : hexToRgba(t.colors.border, 0.9),
        backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRgba(accent, t.isDark ? 0.18 : 0.10),
            borderWidth: 1,
            borderColor: hexToRgba(accent, 0.35),
          }}
        >
          <Ionicons name={icon as any} size={18} color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12 }} numberOfLines={1}>
            {label}
          </Text>
          <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
            {value}
          </Text>
          {sub ? (
            <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function SmallChip({
  text,
  accent,
}: {
  text: string
  accent: string
}) {
  const t = useTheme()
  return (
    <View
      style={{
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: hexToRgba(accent, 0.45),
        backgroundColor: hexToRgba(accent, t.isDark ? 0.16 : 0.10),
      }}
    >
      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }}>
        {text}
      </Text>
    </View>
  )
}

function StageAccent(type: string, t: ReturnType<typeof useTheme>) {
  // Puedes tunear estos colores a gusto
  if (type === 'groups_round_robin') return t.colors.primary
  if (type === 'double_elimination') return '#3B82F6'
  return t.colors.border
}

function StageIcon(type: string) {
  if (type === 'groups_round_robin') return 'people-outline'
  if (type === 'double_elimination') return 'git-branch-outline'
  return 'layers-outline'
}

/** ✅ ConfigTab pro, legible y con jerarquía visual */
export function ConfigTab({
  data,
  onPressEditConfig,
}: {
  data: TournamentDetails
  onPressEditConfig: () => void
}) {
  const t = useTheme()
  const [showDetails, setShowDetails] = useState(false)

  const discipline =
    data.settings?.discipline ? String(data.settings.discipline) : null

  const paid = !!data.settings?.paid
  const entryText = paid ? 'Pagado' : 'Gratis'
  const feeText = paid
    ? formatMoney(data.settings?.currency, data.settings?.entry_fee ?? 0)
    : '—'

  const bestOf = data.settings?.match_format?.best_of_sets ?? null
  const pointsToWin = data.settings?.match_format?.points_to_win ?? null
  const maxPoints = data.settings?.match_format?.max_points_possible ?? null

  const maxPointsLabel =
    maxPoints === 0 ? 'Sin límite' : maxPoints == null ? '—' : String(maxPoints)

  const stageTitles = {
    groups_round_robin: 'Grupos (Round Robin)',
    double_elimination: 'Doble eliminación',
  } satisfies Record<SupportedStageType, string>

  const stageLine = useMemo(() => {
    const names = data.stages
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => stageTitles[s.type] ?? `Etapa ${s.position}`)
    return names.join('  →  ')
  }, [data.stages])

  return (
    <View style={{ gap: t.space.md }}>
      {/* CTA arriba */}
      <View style={{ gap: 8 }}>
        <Button title="Editar configuración" onPress={onPressEditConfig} />
      </View>

      {/* HERO resumen */}
      <Surface accent={t.colors.primary}>
        <View style={{ padding: t.space.md, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hexToRgba(t.colors.primary, t.isDark ? 0.20 : 0.12),
                borderWidth: 1,
                borderColor: hexToRgba(t.colors.primary, 0.35),
              }}
            >
              <Ionicons name="settings-outline" size={22} color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
                Reglas del torneo
              </Text>
              <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }} numberOfLines={2}>
                Resumen rápido para jugadores y staff
              </Text>
            </View>

            <Pressable
              onPress={() => setShowDetails((v) => !v)}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: t.colors.border,
                backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 12 }}>
                {showDetails ? 'Ver menos' : 'Ver detalles'}
              </Text>
            </Pressable>
          </View>

          {/* Pills principales */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Pill
              icon="trophy-outline"
              text={discipline ? `Disciplina: ${discipline}` : 'Disciplina: —'}
              tone="neutral"
            />
            <Pill
              icon="layers-outline"
              text={`Etapas: ${data.stages.length}`}
              tone="neutral"
            />
            <Pill
              icon={paid ? 'cash-outline' : 'leaf-outline'}
              text={`Entrada: ${entryText}`}
              tone={paid ? 'info' : 'primary'}
            />
          </View>

          {/* Línea de etapas (tipo mapa) */}
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
              padding: 12,
            }}
          >
            <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12 }}>
              Formato del torneo
            </Text>
            <Text style={{ color: t.colors.text, fontWeight: '900', marginTop: 4 }} numberOfLines={2}>
              {stageLine || '—'}
            </Text>
          </View>
        </View>
      </Surface>

      {/* GRID reglas de match */}
      <Surface accent='#3B82F6'>
        <View style={{ padding: t.space.md, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hexToRgba('#3B82F6', t.isDark ? 0.18 : 0.10),
                borderWidth: 1,
                borderColor: hexToRgba('#3B82F6', 0.35),
              }}
            >
              <Ionicons name="game-controller-outline" size={18} color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
                Reglas del match
              </Text>
              <Text style={{ color: t.colors.muted, fontWeight: '700', fontSize: 12 }}>
                Lo importante para cada enfrentamiento
              </Text>
            </View>

            {/* Cuota destacada si aplica */}
            {paid ? (
              <SmallChip text={`Cuota: ${feeText}`} accent={'#3B82F6'} />
            ) : (
              <SmallChip text="Sin cuota" accent={'#3B82F6'} />
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <StatTile
              icon="albums-outline"
              label="Sets"
              value={bestOf == null ? '—' : `Mejor de ${bestOf}`}
              accent="#3B82F6"
              sub="Cantidad de sets por match"
            />
            <StatTile
              icon="flag-outline"
              label="Victoria"
              value={pointsToWin == null ? '—' : `${pointsToWin} puntos`}
              accent="#3B82F6"
              sub="Puntos para ganar"
            />
            <StatTile
              icon="infinite-outline"
              label="Límite"
              value={maxPointsLabel}
              accent="#3B82F6"
              sub={maxPoints === 0 ? 'No hay máximo' : 'Máximo de puntos'}
            />
          </View>

          {showDetails ? (
            <View
              style={{
                marginTop: 2,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.colors.border,
                backgroundColor: t.isDark ? t.colors.card : '#FFFFFF',
                padding: 12,
              }}
            >
              <Text style={{ color: t.colors.muted, fontWeight: '700', lineHeight: 18 }}>
                Tip: si “Máximo de puntos” está en <Text style={{ color: t.colors.text, fontWeight: '900' }}>Sin límite</Text>,
                el match se decide solo por “Puntos para ganar”.
              </Text>
            </View>
          ) : null}
        </View>
      </Surface>

      {/* ETAPAS con diseño tipo timeline */}
      <View style={{ gap: 10 }}>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }}>
          Etapas
        </Text>

        {data.stages
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((s) => {
            const accent = StageAccent(s.type, t)
            const title = stageTitles[s.type] ?? `Etapa ${s.position}`

            return (
              <Surface key={`${s.position}-${s.type}`} accent={accent}>
                <View style={{ padding: t.space.md, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: hexToRgba(accent, t.isDark ? 0.18 : 0.10),
                        borderWidth: 1,
                        borderColor: hexToRgba(accent, 0.35),
                      }}
                    >
                      <Ionicons name={StageIcon(s.type) as any} size={20} color={t.isDark ? hexToRgba('#FFFFFF', 0.92) : '#14532D'} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 12 }}>
                        Etapa #{s.position}
                      </Text>
                    </View>

                    <SmallChip text={s.type === 'groups_round_robin' ? 'Grupos' : 'Bracket'} accent={accent} />
                  </View>

                  {/* Contenido amigable */}
                  {s.type === 'groups_round_robin' ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <StatTile
                        icon="grid-outline"
                        label="Modo"
                        value={(s.config.groups.mode || '—').toString()}
                        accent={accent}
                      />
                      <StatTile
                        icon="people-outline"
                        label="Grupo"
                        value={`${s.config.groups.group_size ?? '—'} jugadores`}
                        accent={accent}
                      />
                      <StatTile
                        icon="arrow-forward-outline"
                        label="Avanzan"
                        value={`${s.config.groups.advance_per_group ?? '—'} por grupo`}
                        accent={accent}
                      />
                      <StatTile
                        icon="repeat-outline"
                        label="Enfrentamientos"
                        value={`${s.config.round_robin.games_per_pair ?? 1} vez`}
                        accent={accent}
                      />
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <StatTile
                        icon="shuffle-outline"
                        label="BYEs"
                        value={s.config.allow_byes ? 'Permitidos' : 'No'}
                        accent={accent}
                        sub="Si faltan jugadores"
                      />
                      <StatTile
                        icon="refresh-outline"
                        label="Gran final"
                        value={s.config.grand_final_reset ? 'Con reset' : 'Sin reset'}
                        accent={accent}
                        sub="Si pierde el invicto"
                      />
                    </View>
                  )}

                  {showDetails ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <Pill icon="information-circle-outline" text="Este formato puede cambiar el orden de los matches." tone="neutral" />
                    </View>
                  ) : null}
                </View>
              </Surface>
            )
          })}
      </View>
    </View>
  )
}
