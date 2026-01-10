export const MVP_TOURNAMENT_DEFAULTS = {
    settings: {
      discipline: 'beyblade_x',
      is_paid: false,
      currency: 'MXN',
      rules: {
        sets_best_of: 3,
        points_to_win: 4,
      },
      seeding: {
        group_rank_order: ['match_wins', 'set_diff', 'point_diff'],
      },
    },
    stages: [
      {
        position: 1,
        type: 'groups_round_robin' as const,
        config: {
          groups: {
            games_per_pairing: 1,
            group_size: 4,
            groups_count: null,
            advance_per_group: 2,
          },
        },
      },
      {
        position: 2,
        type: 'double_elimination' as const,
        config: {
          double_elim: {
            allow_byes: true,
            grand_final_reset: true,
          },
        },
      },
    ],
  }
  