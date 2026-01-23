export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          display_name: string | null
          member_code: string | null
          role: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          display_name?: string | null
          member_code?: string | null
          role?: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          display_name?: string | null
          member_code?: string | null
          role?: Database["public"]["Enums"]["community_role"]
          user_id?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tournament_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          participant_id: string
          seed_in_group: number | null
          stage_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          participant_id: string
          seed_in_group?: number | null
          stage_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          participant_id?: string
          seed_in_group?: number | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_group_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_group_members_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "tournament_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_groups: {
        Row: {
          created_at: string
          group_index: number
          id: string
          name: string | null
          stage_id: string
        }
        Insert: {
          created_at?: string
          group_index: number
          id?: string
          name?: string | null
          stage_id: string
        }
        Update: {
          created_at?: string
          group_index?: number
          id?: string
          name?: string | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_groups_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "tournament_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_match_links: {
        Row: {
          created_at: string
          from_match_id: string
          id: string
          outcome: Database["public"]["Enums"]["match_link_outcome"]
          to_match_id: string
          to_slot: number
        }
        Insert: {
          created_at?: string
          from_match_id: string
          id?: string
          outcome: Database["public"]["Enums"]["match_link_outcome"]
          to_match_id: string
          to_slot: number
        }
        Update: {
          created_at?: string
          from_match_id?: string
          id?: string
          outcome?: Database["public"]["Enums"]["match_link_outcome"]
          to_match_id?: string
          to_slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_match_links_from_match_id_fkey"
            columns: ["from_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_match_links_to_match_id_fkey"
            columns: ["to_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_match_sets: {
        Row: {
          created_at: string
          id: string
          match_id: string
          p1_points: number
          p2_points: number
          set_number: number
          winner_participant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          p1_points?: number
          p2_points?: number
          set_number: number
          winner_participant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          p1_points?: number
          p2_points?: number
          set_number?: number
          winner_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_match_sets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_match_sets_winner_participant_id_fkey"
            columns: ["winner_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          bracket: Database["public"]["Enums"]["bracket_kind"]
          created_at: string
          finished_at: string | null
          group_id: string | null
          id: string
          is_bye: boolean
          match_number: number | null
          p1_participant_id: string | null
          p2_participant_id: string | null
          round: number | null
          stage_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_participant_id: string | null
        }
        Insert: {
          bracket: Database["public"]["Enums"]["bracket_kind"]
          created_at?: string
          finished_at?: string | null
          group_id?: string | null
          id?: string
          is_bye?: boolean
          match_number?: number | null
          p1_participant_id?: string | null
          p2_participant_id?: string | null
          round?: number | null
          stage_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_participant_id?: string | null
        }
        Update: {
          bracket?: Database["public"]["Enums"]["bracket_kind"]
          created_at?: string
          finished_at?: string | null
          group_id?: string | null
          id?: string
          is_bye?: boolean
          match_number?: number | null
          p1_participant_id?: string | null
          p2_participant_id?: string | null
          round?: number | null
          stage_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          winner_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_p1_participant_id_fkey"
            columns: ["p1_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_p2_participant_id_fkey"
            columns: ["p2_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "tournament_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_participant_id_fkey"
            columns: ["winner_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          checked_in: boolean
          created_at: string
          display_name: string | null
          guest_name: string | null
          id: string
          initial_losses: number
          paid: boolean
          status: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
          user_id: string | null
        }
        Insert: {
          checked_in?: boolean
          created_at?: string
          display_name?: string | null
          guest_name?: string | null
          id?: string
          initial_losses?: number
          paid?: boolean
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
          user_id?: string | null
        }
        Update: {
          checked_in?: boolean
          created_at?: string
          display_name?: string | null
          guest_name?: string | null
          id?: string
          initial_losses?: number
          paid?: boolean
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_stages: {
        Row: {
          config: Json
          created_at: string
          id: string
          position: number
          tournament_id: string
          type: Database["public"]["Enums"]["stage_type"]
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          position: number
          tournament_id: string
          type: Database["public"]["Enums"]["stage_type"]
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          position?: number
          tournament_id?: string
          type?: Database["public"]["Enums"]["stage_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tournament_stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          community_id: string | null
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          name: string
          settings: Json
          starts_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          name: string
          settings?: Json
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          name?: string
          settings?: Json
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_profile: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          full_name: string | null
          id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_community: { Args: { p_name: string }; Returns: string }
      is_username_available: { Args: { u: string }; Returns: boolean }
    }
    Enums: {
      bracket_kind:
        | "group"
        | "winners"
        | "losers"
        | "grand_final"
        | "grand_final_reset"
      community_role: "owner" | "admin" | "member"
      match_link_outcome: "winner" | "loser"
      match_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      participant_status:
        | "registered"
        | "checked_in"
        | "active"
        | "dropped"
        | "disqualified"
        | "eliminated"
      stage_type: "groups_round_robin" | "double_elimination"
      tournament_status:
        | "draft"
        | "open"
        | "locked"
        | "running"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bracket_kind: [
        "group",
        "winners",
        "losers",
        "grand_final",
        "grand_final_reset",
      ],
      community_role: ["owner", "admin", "member"],
      match_link_outcome: ["winner", "loser"],
      match_status: ["scheduled", "in_progress", "completed", "cancelled"],
      participant_status: [
        "registered",
        "checked_in",
        "active",
        "dropped",
        "disqualified",
        "eliminated",
      ],
      stage_type: ["groups_round_robin", "double_elimination"],
      tournament_status: [
        "draft",
        "open",
        "locked",
        "running",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
