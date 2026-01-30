// src/services/tournaments.service.ts
import { supabase } from '../lib/supabase'
import { TOURNAMENT_DEFAULTS } from '../defaults/tournamentDefaults'
import { err, ok, type Result } from './_result'

import type { Json, Database } from '../types/supabase'
import type {
  CreateTournamentPayload,
  TournamentDetails,
  TournamentListItem,
  TournamentParticipantListItem,
  TournamentStage,
  SupportedStageType,
  ParticipantStatus,
  TournamentSettings,
  TournamentStageInput
} from '../domain/tournaments'

import { coerceTournamentSettings, coerceStage } from '../domain/tournaments'

type StageRaw = {
  position: number
  type: unknown
  config: unknown
  created_at?: string
}

type SupportedStageRaw = Omit<StageRaw, 'type'> & { type: SupportedStageType }

function isSupportedStageRow(s: StageRaw): s is SupportedStageRaw {
  return isSupportedStageType(s.type)
}

// ✅ DB types (solo internos del service)
type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * ✅ Helpers
 */
function toJson<T>(v: T): Json {
  return JSON.parse(JSON.stringify(v)) as Json
}

function isSupportedStageType(t: unknown): t is SupportedStageType {
  return t === 'groups_round_robin' || t === 'double_elimination'
}

/**
 * ============================================================
 * ✅ Create Tournament
 * ============================================================
 */

export async function createTournament(
  payload: CreateTournamentPayload
): Promise<Result<{ tournamentId: string }>> {
  try {
    const name = payload.name.trim()
    if (!name) return err(new Error('Nombre vacío'))

    const settings = payload.settings ?? TOURNAMENT_DEFAULTS.settings
    const stages = payload.stages ?? TOURNAMENT_DEFAULTS.stages

    // 1) crear torneo
    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name,
        community_id: payload.communityId ?? null,
        starts_at: payload.startsAt ?? null,
        ends_at: payload.endsAt ?? null,
        settings: toJson(settings),
        status: 'draft',
      })
      .select('id')
      .single()

    if (tErr) return err(tErr)

    // 2) crear stages
    if (stages.length > 0) {
      const stagesPayload = stages.map((s) => ({
        tournament_id: t.id,
        position: s.position,
        type: s.type,
        config: toJson(s.config),
      }))

      const { error: sErr } = await supabase
        .from('tournament_stages')
        .insert(stagesPayload)

      if (sErr) {
        // rollback simple MVP
        await supabase.from('tournaments').delete().eq('id', t.id)
        return err(sErr)
      }
    }

    return ok({ tournamentId: t.id })
  } catch (e) {
    return err(e)
  }
}

export async function createTournamentMvp(params: {
  name: string
  communityId?: string | null
}) {
  return createTournament({
    name: params.name,
    communityId: params.communityId ?? null,
    settings: TOURNAMENT_DEFAULTS.settings,
    stages: TOURNAMENT_DEFAULTS.stages,
  })
}

/**
 * ============================================================
 * ✅ List / Delete tournaments
 * ============================================================
 */

export async function listMyTournaments(params?: {
  page?: number
  pageSize?: number
}): Promise<Result<{ items: TournamentListItem[]; hasMore: boolean }>> {
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 20

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, status, created_at, starts_at, ends_at')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return err(error)

  const items = (data ?? []) as TournamentListItem[]
  const hasMore = items.length === pageSize

  return ok({ items, hasMore })
}

export async function deleteTournament(tournamentId: string): Promise<Result<null>> {
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId)
  if (error) return err(error)
  return ok(null)
}

/**
 * ============================================================
 * ✅ Tournament Details (dominio tipado ✅)
 * ============================================================
 */

export async function getTournamentDetails(
  tournamentId: string
): Promise<Result<TournamentDetails>> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(
      `
      id,
      name,
      status,
      created_at,
      starts_at,
      ends_at,
      community_id,
      settings,
      tournament_stages (
        position,
        type,
        config,
        created_at
      )
    `
    )
    .eq('id', tournamentId)
    .single()

  if (error) return err(error)
  if (!data) return err(new Error('Torneo no encontrado'))

  const stagesRaw = ((data as any).tournament_stages ?? []) as StageRaw[]

  const stages: TournamentStage[] = stagesRaw
    .filter(isSupportedStageRow) // ✅ ahora TS sabe que s.type es SupportedStageType
    .map((s) =>
      coerceStage({
        position: s.position,
        type: s.type, // ✅ ya no es unknown
        config: s.config,
        created_at: s.created_at,
      })
    )
    .sort((a, b) => a.position - b.position)
  

  return ok({
    id: data.id,
    name: data.name,
    status: data.status,
    created_at: data.created_at,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    community_id: data.community_id,
    settings: coerceTournamentSettings(data.settings),
    stages,
  })
}

/**
 * ============================================================
 * ✅ Participants
 * ============================================================
 */

export async function listTournamentParticipants(
  tournamentId: string,
  params?: { page?: number; pageSize?: number }
): Promise<
  Result<{ items: TournamentParticipantListItem[]; hasMore: boolean; total: number }>
> {
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 50

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('tournament_participants')
    .select(
      'id,tournament_id,user_id,guest_name,display_name,status,checked_in,paid,created_at',
      { count: 'exact' }
    )
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) return err(error)

  const items = (data ?? []) as TournamentParticipantListItem[]
  const hasMore = items.length === pageSize

  return ok({
    items,
    hasMore,
    total: count ?? items.length,
  })
}

export async function addGuestParticipant(params: {
  tournamentId: string
  guestName: string
}): Promise<Result<{ participantId: string }>> {
  const name = params.guestName.trim()
  if (!name) return err(new Error('Nombre vacío'))

  const { data, error } = await supabase
    .from('tournament_participants')
    .insert({
      tournament_id: params.tournamentId,
      guest_name: name,
      display_name: name,
      status: 'registered',
    })
    .select('id')
    .single()

  if (error) {
    // ✅ Postgres unique violation
    if ((error as any)?.code === '23505') {
      return err(new Error('Ya existe un invitado con ese nombre en este torneo.'))
    }
    return err(error)
  }

  return ok({ participantId: data.id })
}

export async function addUserParticipantByUsername(params: {
  tournamentId: string
  username: string
}): Promise<Result<{ participantId: string }>> {
  const username = params.username.trim().toLowerCase()
  if (!username) return err(new Error('Username vacío'))

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .maybeSingle()

  if (pErr) return err(pErr)
  if (!profile) return err(new Error('No existe ese usuario'))

  const p = profile as Pick<ProfileRow, 'id' | 'username' | 'display_name'>
  const display = (p.display_name?.trim() || p.username || username) ?? username

  const { data, error } = await supabase
    .from('tournament_participants')
    .insert({
      tournament_id: params.tournamentId,
      user_id: p.id,
      display_name: display,
      status: 'registered' satisfies ParticipantStatus,
    })
    .select('id')
    .single()

  if (error) return err(error)
  return ok({ participantId: data.id })
}

export async function deleteParticipant(participantId: string): Promise<Result<null>> {
  const { error } = await supabase
    .from('tournament_participants')
    .delete()
    .eq('id', participantId)

  if (error) return err(error)
  return ok(null)
}

// ✅ Actualiza check-in
export async function setParticipantCheckIn(
  participantId: string,
  checkedIn: boolean
): Promise<Result<null>> {
  const { error } = await supabase
    .from('tournament_participants')
    .update({ checked_in: checkedIn })
    .eq('id', participantId)

  if (error) return err(error)
  return ok(null)
}

// ✅ Actualiza pagado
export async function setParticipantPaid(
  participantId: string,
  paid: boolean
): Promise<Result<null>> {
  const { error } = await supabase
    .from('tournament_participants')
    .update({ paid })
    .eq('id', participantId)

  if (error) return err(error)
  return ok(null)
}

export async function getTournamentParticipantStats(
  tournamentId: string,
  tournamentPaid: boolean
): Promise<Result<{ checkedIn: number; paid: number }>> {
  const checkedQ = supabase
    .from('tournament_participants')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('checked_in', true)

  const paidQ = tournamentPaid
    ? supabase
        .from('tournament_participants')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('paid', true)
    : null

  const [checkedRes, paidRes] = await Promise.all([
    checkedQ,
    paidQ ?? Promise.resolve({ count: 0, error: null } as any),
  ])

  if (checkedRes.error) return err(checkedRes.error)
  if (paidRes?.error) return err(paidRes.error)

  return ok({
    checkedIn: checkedRes.count ?? 0,
    paid: paidRes?.count ?? 0,
  })
}

export async function updateTournamentSettings(
  tournamentId: string,
  settings: TournamentSettings
): Promise<Result<null>> {
  const { error } = await supabase
    .from('tournaments')
    .update({ settings: toJson(settings) })
    .eq('id', tournamentId)

  if (error) return err(error)
  return ok(null)
}

/**
 * MVP: reemplazar todas las etapas.
 * (Más adelante lo podemos cambiar a upsert por stage_id o por (tournament_id, position).)
 */
export async function replaceTournamentStages(
  tournamentId: string,
  stages: ReadonlyArray<TournamentStageInput>
): Promise<Result<null>> {
  const del = await supabase
    .from('tournament_stages')
    .delete()
    .eq('tournament_id', tournamentId)

  if (del.error) return err(del.error)

  if (stages.length === 0) return ok(null)

  const payload = stages.map((s) => ({
    tournament_id: tournamentId,
    position: s.position,
    type: s.type,
    config: toJson(s.config),
  }))

  const ins = await supabase.from('tournament_stages').insert(payload)
  if (ins.error) return err(ins.error)

  return ok(null)
}