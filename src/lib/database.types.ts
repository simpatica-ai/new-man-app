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
      ai_prompt_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: number
          prompt_content: string
          prompt_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: number
          prompt_content: string
          prompt_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: number
          prompt_content?: string
          prompt_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompt_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      error_logs: {
        Row: {
          context: string
          created_at: string | null
          error_code: string | null
          error_message: string
          id: number
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          error_code?: string | null
          error_message: string
          id?: number
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          id?: number
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          roles: string[]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          roles: string[]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          roles?: string[]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active_user_count: number | null
          billing_email: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          id: string
          logo_url: string | null
          max_users: number | null
          name: string
          next_billing_date: string | null
          payment_method_id: string | null
          phone_number: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          active_user_count?: number | null
          billing_email?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name: string
          next_billing_date?: string | null
          payment_method_id?: string | null
          phone_number?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          active_user_count?: number | null
          billing_email?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name?: string
          next_billing_date?: string | null
          payment_method_id?: string | null
          phone_number?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_assignments: {
        Row: {
          active: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string
          practitioner_id: string
          supervisor_id: string
          supervisor_role: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id: string
          practitioner_id: string
          supervisor_id: string
          supervisor_role: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string
          practitioner_id?: string
          supervisor_id?: string
          supervisor_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          archived_at: string | null
          archived_by: string | null
          created_at: string | null
          current_stage: number | null
          current_virtue_id: number | null
          full_name: string | null
          has_completed_first_assessment: boolean | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          organization_id: string | null
          phone_number: string | null
          role: string | null
          roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          current_stage?: number | null
          current_virtue_id?: number | null
          full_name?: string | null
          has_completed_first_assessment?: boolean | null
          id: string
          is_active?: boolean | null
          last_activity?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: string | null
          roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          current_stage?: number | null
          current_virtue_id?: number | null
          full_name?: string | null
          has_completed_first_assessment?: boolean | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: string | null
          roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profile_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_virtue_id_fkey"
            columns: ["current_virtue_id"]
            isOneToOne: false
            referencedRelation: "virtues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_chat_messages: {
        Row: {
          connection_id: number
          created_at: string
          deleted_at: string | null
          id: number
          message_search: unknown
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
          message_search?: unknown
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
          message_search?: unknown
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
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          id?: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          status?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_activity_sessions: {
        Row: {
          created_at: string | null
          current_page: string | null
          last_seen: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_page?: string | null
          last_seen?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_page?: string | null
          last_seen?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
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
      virtue_prompts: {
        Row: {
          created_at: string | null
          id: number
          prompt_text: string
          stage_number: number
          user_id: string | null
          user_response: string | null
          virtue_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          prompt_text: string
          stage_number: number
          user_id?: string | null
          user_response?: string | null
          virtue_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          prompt_text?: string
          stage_number?: number
          user_id?: string | null
          user_response?: string | null
          virtue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "virtue_prompts_virtue_id_fkey"
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
      virtue_training_data: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          input_text: string
          is_approved: boolean | null
          notes: string | null
          output_text: string
          philosophical_tradition: string | null
          prompt_name: string | null
          prompt_used: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          input_text: string
          is_approved?: boolean | null
          notes?: string | null
          output_text: string
          philosophical_tradition?: string | null
          prompt_name?: string | null
          prompt_used?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          input_text?: string
          is_approved?: boolean | null
          notes?: string | null
          output_text?: string
          philosophical_tradition?: string | null
          prompt_name?: string | null
          prompt_used?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      virtues: {
        Row: {
          author_reflection: string | null
          description: string | null
          id: number
          name: string
          short_description: string | null
          story_of_virtue: string | null
          virtue_guide: string | null
        }
        Insert: {
          author_reflection?: string | null
          description?: string | null
          id?: never
          name: string
          short_description?: string | null
          story_of_virtue?: string | null
          virtue_guide?: string | null
        }
        Update: {
          author_reflection?: string | null
          description?: string | null
          id?: never
          name?: string
          short_description?: string | null
          story_of_virtue?: string | null
          virtue_guide?: string | null
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
      accept_organization_invitation: {
        Args: { invitation_token: string; user_id: string }
        Returns: Json
      }
      archive_organization_user: {
        Args: { archive?: boolean; user_id: string }
        Returns: boolean
      }
      archive_user: {
        Args: { archived_by_id: string; user_id: string }
        Returns: boolean
      }
      create_coach_connection: {
        Args: { coach_id?: string; practitioner_id: string }
        Returns: {
          connection_id: number
          message: string
          success: boolean
        }[]
      }
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
        Args: never
        Returns: {
          connection_id: number
          email: string
          full_name: string
          id: string
          sponsor_name: string
        }[]
      }
      get_all_support_tickets: {
        Args: never
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
      get_database_size: { Args: never; Returns: number }
      get_my_role: { Args: never; Returns: string }
      get_organization_activity_overview: {
        Args: { org_id: string }
        Returns: {
          created_at: string
          current_stage: number
          current_virtue_id: number
          days_since_activity: number
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_activity: string
          roles: string[]
        }[]
      }
      get_organization_stats: {
        Args: { org_id: string }
        Returns: {
          active_members: number
          archived_members: number
          engagement_rate: number
          recently_active: number
          total_members: number
        }[]
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
      get_user_organization_id: { Args: never; Returns: string }
      increment_active_user_count: { Args: { org_id: string }; Returns: number }
      reactivate_user: { Args: { user_id: string }; Returns: boolean }
      update_organization_active_user_count: {
        Args: { org_id: string }
        Returns: number
      }
      update_organization_info: {
        Args: {
          description?: string
          logo_url?: string
          org_id: string
          phone_number?: string
          website_url?: string
        }
        Returns: boolean
      }
      update_organization_logo: {
        Args: { logo_url: string; org_id: string }
        Returns: boolean
      }
      update_user_roles: {
        Args: { new_roles: string[]; user_id: string }
        Returns: boolean
      }
      validate_organization_user_limit: {
        Args: { org_id: string }
        Returns: boolean
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
