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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      affirmations: {
        Row: {
          created_at: string | null
          id: number
          text: string
          virtue_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          text: string
          virtue_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          text?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "affirmations_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          category: string | null
          definition: string | null
          icon_name: string | null
          id: number
          name: string
        }
        Insert: {
          category?: string | null
          definition?: string | null
          icon_name?: string | null
          id?: number
          name: string
        }
        Update: {
          category?: string | null
          definition?: string | null
          icon_name?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      defects_virtues: {
        Row: {
          defect_id: number
          virtue_id: number
        }
        Insert: {
          defect_id: number
          virtue_id: number
        }
        Update: {
          defect_id?: number
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "defect_virtues_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defect_virtues_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          entry_text: string | null
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_text?: string | null
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          entry_text?: string | null
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      practitioner_freeform_entries: {
        Row: {
          created_at: string
          entry_text: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_text: string
          id?: never
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_text?: string
          id?: never
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practitioner_stage_memos: {
        Row: {
          created_at: string
          id: number
          memo_text: string
          stage_number: number
          updated_at: string
          user_id: string
          virtue_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          memo_text: string
          stage_number: number
          updated_at?: string
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string
          id?: never
          memo_text?: string
          stage_number?: number
          updated_at?: string
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_stage_memos_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          has_completed_first_assessment: boolean | null
          id: string
          phone_number: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          has_completed_first_assessment?: boolean | null
          id: string
          phone_number?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          has_completed_first_assessment?: boolean | null
          id?: string
          phone_number?: string | null
          role?: string | null
        }
        Relationships: []
      }
      sponsor_chat_messages: {
        Row: {
          connection_id: number
          created_at: string
          deleted_at: string | null
          id: number
          message_search: unknown | null
          message_text: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          connection_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          message_search?: unknown | null
          message_text: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          connection_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          message_search?: unknown | null
          message_text?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_chat_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "sponsor_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_connections: {
        Row: {
          id: number
          journal_shared: boolean
          practitioner_user_id: string | null
          sponsor_user_id: string | null
          status: string | null
        }
        Insert: {
          id?: never
          journal_shared?: boolean
          practitioner_user_id?: string | null
          sponsor_user_id?: string | null
          status?: string | null
        }
        Update: {
          id?: never
          journal_shared?: boolean
          practitioner_user_id?: string | null
          sponsor_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_connections_sponsor_user_id_fkey_profiles"
            columns: ["sponsor_user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_connections_sponsor_user_id_fkey_profiles"
            columns: ["sponsor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_feedback: {
        Row: {
          connection_id: number | null
          created_at: string | null
          feedback_text: string
          id: number
          journal_entry_id: number | null
        }
        Insert: {
          connection_id?: number | null
          created_at?: string | null
          feedback_text: string
          id?: never
          journal_entry_id?: number | null
        }
        Update: {
          connection_id?: number | null
          created_at?: string | null
          feedback_text?: string
          id?: never
          journal_entry_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_feedback_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "sponsor_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_relationships: {
        Row: {
          created_at: string | null
          id: string
          invitation_token: string | null
          practitioner_id: string | null
          sponsor_email: string | null
          sponsor_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_token?: string | null
          practitioner_id?: string | null
          sponsor_email?: string | null
          sponsor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_token?: string | null
          practitioner_id?: string | null
          sponsor_email?: string | null
          sponsor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_relationships_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_relationships_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_relationships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_relationships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_visible_memos: {
        Row: {
          id: number
          memo_text: string | null
          practitioner_updated_at: string
          sponsor_read_at: string | null
          stage_number: number
          user_id: string
          virtue_id: number
        }
        Insert: {
          id?: never
          memo_text?: string | null
          practitioner_updated_at?: string
          sponsor_read_at?: string | null
          stage_number: number
          user_id: string
          virtue_id: number
        }
        Update: {
          id?: never
          memo_text?: string | null
          practitioner_updated_at?: string
          sponsor_read_at?: string | null
          stage_number?: number
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_visible_memos_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_prompts: {
        Row: {
          id: number
          prompt_text: string
          prompt_type: string
          stage_id: number | null
        }
        Insert: {
          id?: never
          prompt_text: string
          prompt_type: string
          stage_id?: number | null
        }
        Update: {
          id?: never
          prompt_text?: string
          prompt_type?: string
          stage_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_prompts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "virtue_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: number
          message: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_active_virtue: {
        Row: {
          id: number
          user_id: string | null
          virtue_id: number | null
        }
        Insert: {
          id?: never
          user_id?: string | null
          virtue_id?: number | null
        }
        Update: {
          id?: never
          user_id?: string | null
          virtue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_active_virtue_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assessment_defects: {
        Row: {
          assessment_id: number
          created_at: string
          defect_name: string
          harm_level: string
          id: number
          rating: number
          user_id: string
        }
        Insert: {
          assessment_id: number
          created_at?: string
          defect_name: string
          harm_level: string
          id?: never
          rating: number
          user_id: string
        }
        Update: {
          assessment_id?: number
          created_at?: string
          defect_name?: string
          harm_level?: string
          id?: never
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_defects_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assessment_results: {
        Row: {
          assessment_id: number
          created_at: string
          defect_intensity: number | null
          id: number
          priority_score: number
          user_id: string
          virtue_name: string
        }
        Insert: {
          assessment_id: number
          created_at?: string
          defect_intensity?: number | null
          id?: never
          priority_score: number
          user_id: string
          virtue_name: string
        }
        Update: {
          assessment_id?: number
          created_at?: string
          defect_intensity?: number | null
          id?: never
          priority_score?: number
          user_id?: string
          virtue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assessments: {
        Row: {
          assessment_type: string
          created_at: string
          id: number
          status: string
          summary_analysis: string | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          created_at?: string
          id?: never
          status?: string
          summary_analysis?: string | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          id?: never
          status?: string
          summary_analysis?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_virtue_ai_prompts: {
        Row: {
          created_at: string | null
          id: number
          memo_hash: string
          prompt_text: string
          stage_number: number
          updated_at: string | null
          user_id: string
          virtue_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          memo_hash: string
          prompt_text: string
          stage_number: number
          updated_at?: string | null
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          memo_hash?: string
          prompt_text?: string
          stage_number?: number
          updated_at?: string | null
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_virtue_ai_prompts_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_virtue_stage_memos: {
        Row: {
          created_at: string | null
          id: number
          memo_text: string | null
          stage_number: number
          user_id: string
          virtue_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          memo_text?: string | null
          stage_number: number
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          memo_text?: string | null
          stage_number?: number
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_virtue_stage_memos_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_virtue_stage_progress: {
        Row: {
          created_at: string
          id: number
          stage_number: number
          status: string
          updated_at: string
          user_id: string
          virtue_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          stage_number: number
          status?: string
          updated_at?: string
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string
          id?: never
          stage_number?: number
          status?: string
          updated_at?: string
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_virtue_stage_progress_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      virtue_analysis: {
        Row: {
          analysis_text: string | null
          assessment_id: number
          created_at: string | null
          id: number
          user_id: string
          virtue_id: number
        }
        Insert: {
          analysis_text?: string | null
          assessment_id: number
          created_at?: string | null
          id?: number
          user_id: string
          virtue_id: number
        }
        Update: {
          analysis_text?: string | null
          assessment_id?: number
          created_at?: string | null
          id?: number
          user_id?: string
          virtue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "virtue_analysis_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtue_analysis_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      virtue_stages: {
        Row: {
          id: number
          stage_number: number
          title: string | null
          virtue_id: number | null
        }
        Insert: {
          id?: never
          stage_number: number
          title?: string | null
          virtue_id?: number | null
        }
        Update: {
          id?: never
          stage_number?: number
          title?: string | null
          virtue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "virtue_stages_virtue_id_fkey"
            columns: ["virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
        ]
      }
      virtues: {
        Row: {
          author_reflection: string | null
          description: string | null
          id: number
          name: string
          short_description: string | null
          story_of_virtue: string | null
        }
        Insert: {
          author_reflection?: string | null
          description?: string | null
          id?: never
          name: string
          short_description?: string | null
          story_of_virtue?: string | null
        }
        Update: {
          author_reflection?: string | null
          description?: string | null
          id?: never
          name?: string
          short_description?: string | null
          story_of_virtue?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profile_with_email: {
        Row: {
          full_name: string | null
          id: string | null
          role: string | null
          user_email: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_active_sponsorships_for_sponsor: {
        Args: { sponsor_id_param: string }
        Returns: {
          id: number
          practitioner_id: string
          practitioner_name: string
          status: string
        }[]
      }
      get_all_practitioner_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          connection_id: number
          email: string
          full_name: string
          id: string
          sponsor_name: string
        }[]
      }
      get_all_support_tickets: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: number
          message: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          user_email: string
          user_full_name: string
        }[]
      }
      get_database_size: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_invitations_for_sponsor: {
        Args: { sponsor_id_param: string }
        Returns: {
          id: number
          practitioner_id: string
          practitioner_name: string
          status: string
        }[]
      }
      get_practitioner_connection_details: {
        Args: { practitioner_id_param: string }
        Returns: {
          id: number
          sponsor_name: string
          status: string
        }[]
      }
      get_sponsor_practitioner_alerts: {
        Args: { sponsor_id_param: string }
        Returns: {
          has_unread_chats: boolean
          has_unread_memos: boolean
          practitioner_id: string
          practitioner_name: string
        }[]
      }
      get_user_active_virtue_details: {
        Args: { user_id_param: string }
        Returns: {
          prompts: Json
          stage_number: number
          stage_title: string
          virtue_id: number
          virtue_name: string
        }[]
      }
    }
    Enums: {
      support_ticket_status: "Open" | "In Progress" | "Closed"
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
      support_ticket_status: ["Open", "In Progress", "Closed"],
    },
  },
} as const
