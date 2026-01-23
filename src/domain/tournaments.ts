// src/domain/tournaments.ts
import type { Database } from '../types/supabase'

type Enums = Database['public']['Enums']

// ✅ Enums reales de DB
export type TournamentStatus = Enums['tournament_status']
export type StageType = Enums['stage_type']
export type ParticipantStatus = Enums['participant_status']

/**
 * En el MVP soportamos estas etapas.
 * (Si después agregas más en DB, las soportas aquí)
 */
export type SupportedStageType = Extract<
  StageType,
  'groups_round_robin' | 'double_elimination'
>

/**
 * ============================================================
 * ✅ Settings del torneo (tournaments.settings)
 * ============================================================
 */

export type Discipline = 'beyblade_x' // luego expandes
export type CurrencyCode = 'MXN' | 'USD' | string

export type MatchFormat = {
  best_of_sets: number
  points_to_win: number
  max_points_possible: number
}

export type TournamentSettings = {
  discipline: Discipline
  paid: boolean
  currency: CurrencyCode
  entry_fee: number
  match_format: MatchFormat
}

/**
 * ✅ Defaults base (opcional, pero útil)
 */
export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  discipline: 'beyblade_x',
  paid: false,
  currency: 'MXN',
  entry_fee: 0,
  match_format: {
    best_of_sets: 3,
    points_to_win: 4,
    max_points_possible: 9,
  },
}

/**
 * ============================================================
 * ✅ Stage Configs (tournament_stages.config)
 * ============================================================
 */

export type RankingCriterion =
  | 'points'
  | 'sets_won'
  | 'matches_won'
  | 'point_diff'

export type GroupsRoundRobinConfig = {
  groups: {
    mode: 'auto' | 'manual'
    group_size: number
    advance_per_group: number
  }
  round_robin: {
    games_per_pair: number
  }
  ranking: {
    order: ReadonlyArray<RankingCriterion>
  }
}

export type DoubleEliminationConfig = {
  allow_byes: boolean
  grand_final_reset: boolean
}

/**
 * Unión de configs posibles (depende del type)
 */
export type StageConfigByType = GroupsRoundRobinConfig | DoubleEliminationConfig

export const DEFAULT_GROUPS_RR_CONFIG: GroupsRoundRobinConfig = {
  groups: { mode: 'auto', group_size: 4, advance_per_group: 2 },
  round_robin: { games_per_pair: 1 },
  ranking: { order: ['points', 'sets_won', 'matches_won', 'point_diff'] },
}

export const DEFAULT_DOUBLE_ELIM_CONFIG: DoubleEliminationConfig = {
  allow_byes: true,
  grand_final_reset: true,
}

/**
 * ============================================================
 * ✅ Stage tipado (discriminated union)
 * ============================================================
 */

export type GroupsRoundRobinStage = {
  position: number
  type: 'groups_round_robin'
  config: GroupsRoundRobinConfig
  created_at?: string
}

export type DoubleEliminationStage = {
  position: number
  type: 'double_elimination'
  config: DoubleEliminationConfig
  created_at?: string
}

export type TournamentStage = GroupsRoundRobinStage | DoubleEliminationStage

/**
 * Inputs para crear stages (sin created_at)
 */
export type TournamentStageInput = Omit<TournamentStage, 'created_at'>

/**
 * ============================================================
 * ✅ Modelos de UI (lo que consume la app)
 * ============================================================
 */

export type TournamentListItem = {
  id: string
  name: string
  status: TournamentStatus
  created_at: string
  starts_at: string | null
  ends_at: string | null
}

export type TournamentDetails = {
  id: string
  name: string
  status: TournamentStatus
  created_at: string
  starts_at: string | null
  ends_at: string | null
  community_id: string | null
  settings: TournamentSettings
  stages: TournamentStage[]
}

/**
 * ✅ Payload que recibe el service al crear torneo
 */
export type CreateTournamentPayload = {
  name: string
  communityId?: string | null
  startsAt?: string | null
  endsAt?: string | null
  settings?: TournamentSettings
  stages?: ReadonlyArray<TournamentStageInput>
}

/**
 * ✅ Participantes (lo que consume la UI)
 */
export type TournamentParticipantListItem = {
  id: string
  tournament_id: string
  user_id: string | null
  guest_name: string | null
  display_name: string | null
  status: ParticipantStatus
  checked_in: boolean
  paid: boolean
  created_at: string
}

/**
 * ============================================================
 * ✅ UI helpers (Stage titles tipados)
 * ============================================================
 */

export type StageTitleMap = Record<SupportedStageType, string>

export const STAGE_TITLES: StageTitleMap = {
  groups_round_robin: 'Fase 1: Grupos (Round Robin)',
  double_elimination: 'Fase 2: Doble eliminación',
}

/**
 * ============================================================
 * ✅ Helpers de parseo (Json -> dominio)
 * (MVP: simples, seguros, no “rompen” si algo falta)
 * ============================================================
 */

function isObject(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isRankingCriterion(v: unknown): v is RankingCriterion {
  return v === 'points' || v === 'sets_won' || v === 'matches_won' || v === 'point_diff'
}

function coerceRankingOrder(v: unknown): ReadonlyArray<RankingCriterion> {
  if (!Array.isArray(v)) return DEFAULT_GROUPS_RR_CONFIG.ranking.order
  const safe = v.filter(isRankingCriterion)
  return safe.length ? safe : DEFAULT_GROUPS_RR_CONFIG.ranking.order
}

function coerceGroupsMode(v: unknown): 'auto' | 'manual' {
  return v === 'manual' ? 'manual' : 'auto'
}

export function coerceTournamentSettings(v: unknown): TournamentSettings {
  const base = DEFAULT_TOURNAMENT_SETTINGS
  if (!isObject(v)) return base

  const mf = isObject(v.match_format) ? v.match_format : {}

  return {
    discipline: (v.discipline as Discipline) ?? base.discipline,
    paid: typeof v.paid === 'boolean' ? v.paid : base.paid,
    currency: (v.currency as CurrencyCode) ?? base.currency,
    entry_fee: typeof v.entry_fee === 'number' ? v.entry_fee : base.entry_fee,
    match_format: {
      best_of_sets:
        typeof mf.best_of_sets === 'number'
          ? mf.best_of_sets
          : base.match_format.best_of_sets,
      points_to_win:
        typeof mf.points_to_win === 'number'
          ? mf.points_to_win
          : base.match_format.points_to_win,
      max_points_possible:
        typeof mf.max_points_possible === 'number'
          ? mf.max_points_possible
          : base.match_format.max_points_possible,
    },
  }
}

export function coerceStage(row: {
  position: number
  type: SupportedStageType
  config: unknown
  created_at?: string
}): TournamentStage {
  if (row.type === 'groups_round_robin') {
    const base = DEFAULT_GROUPS_RR_CONFIG

    if (!isObject(row.config)) {
      return {
        position: row.position,
        type: row.type,
        config: base,
        created_at: row.created_at,
      }
    }

    const cfg = row.config

    return {
      position: row.position,
      type: row.type,
      created_at: row.created_at,
      config: {
        groups: {
          mode: coerceGroupsMode(cfg.groups?.mode),
          group_size:
            typeof cfg.groups?.group_size === 'number'
              ? cfg.groups.group_size
              : base.groups.group_size,
          advance_per_group:
            typeof cfg.groups?.advance_per_group === 'number'
              ? cfg.groups.advance_per_group
              : base.groups.advance_per_group,
        },
        round_robin: {
          games_per_pair:
            typeof cfg.round_robin?.games_per_pair === 'number'
              ? cfg.round_robin.games_per_pair
              : base.round_robin.games_per_pair,
        },
        ranking: {
          order: coerceRankingOrder(cfg.ranking?.order),
        },
      },
    }
  }

  // double_elimination
  const base = DEFAULT_DOUBLE_ELIM_CONFIG

  if (!isObject(row.config)) {
    return {
      position: row.position,
      type: row.type,
      config: base,
      created_at: row.created_at,
    }
  }

  return {
    position: row.position,
    type: row.type,
    created_at: row.created_at,
    config: {
      allow_byes:
        typeof row.config.allow_byes === 'boolean'
          ? row.config.allow_byes
          : base.allow_byes,
      grand_final_reset:
        typeof row.config.grand_final_reset === 'boolean'
          ? row.config.grand_final_reset
          : base.grand_final_reset,
    },
  }
}
