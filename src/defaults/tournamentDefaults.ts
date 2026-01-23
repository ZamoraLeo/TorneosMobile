// src/defaults/tournamentDefaults.ts
import type { TournamentSettings, TournamentStageInput } from '../domain/tournaments'

export const TOURNAMENT_DEFAULTS = {
  settings: {
    discipline: 'beyblade_x',
    paid: false,
    currency: 'MXN',
    entry_fee: 0,

    match_format: {
      best_of_sets: 3,
      points_to_win: 4,
      max_points_possible: 9,
    },
  },

  stages: [
    {
      position: 1,
      type: 'groups_round_robin',
      config: {
        groups: {
          mode: 'auto',
          group_size: 4,
          advance_per_group: 2,
        },
        round_robin: {
          games_per_pair: 1,
        },
        ranking: {
          order: ['points', 'sets_won', 'matches_won', 'point_diff'],
        },
      },
    },

    {
      position: 2,
      type: 'double_elimination',
      config: {
        allow_byes: true,
        grand_final_reset: true,
      },
    },
  ],
} as const satisfies {
  settings: TournamentSettings
  stages: ReadonlyArray<TournamentStageInput>
}
