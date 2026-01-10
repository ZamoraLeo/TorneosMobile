import { supabase } from '../lib/supabase'

export type CreateTournamentPayload = {
  name: string
  communityId?: string | null
  startsAt?: string | null
  endsAt?: string | null

  // JSONB
  settings: Record<string, any>

  // stages: MVP 2
  stages: Array<{
    position: number
    type: 'groups_round_robin' | 'double_elimination'
    config: Record<string, any>
  }>
}

export type CreateTournamentResult =
  | { ok: true; tournamentId: string }
  | { ok: false; error: any }

export async function createTournament(payload: CreateTournamentPayload): Promise<CreateTournamentResult> {
  try {
    // 1) create tournament
    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name: payload.name,
        community_id: payload.communityId ?? null,
        starts_at: payload.startsAt ?? null,
        ends_at: payload.endsAt ?? null,
        settings: payload.settings,
      })
      .select('id')
      .single()

    if (tErr) return { ok: false, error: tErr }

    // 2) create stages
    const stagesPayload = payload.stages.map((s) => ({
      tournament_id: t.id,
      position: s.position,
      type: s.type,
      config: s.config,
    }))

    const { error: sErr } = await supabase.from('tournament_stages').insert(stagesPayload)
    if (sErr) {
      // best-effort cleanup (sin RPC transaccional)
      await supabase.from('tournaments').delete().eq('id', t.id)
      return { ok: false, error: sErr }
    }

    return { ok: true, tournamentId: t.id }
  } catch (e) {
    return { ok: false, error: e }
  }
}
