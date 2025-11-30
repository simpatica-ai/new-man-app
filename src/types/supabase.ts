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
    PostgrestVersion: "13.0.5"
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
          id: number
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
          id: number
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
      monitoring_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: number
          message: string
          severity: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: number
          message: string
          severity: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: number
          message?: string
          severity?: string
        }
        Relationships: []
      }
      organization_requests: {
        Row: {
          admin_notes: string | null
          contact_email: string
          contact_name: string
          contact_title: string | null
          created_at: string | null
          estimated_users: number | null
          id: string
          organization_description: string | null
          organization_name: string
          phone_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          use_case: string | null
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          contact_email: string
          contact_name: string
          contact_title?: string | null
          created_at?: string | null
          estimated_users?: number | null
          id?: string
          organization_description?: string | null
          organization_name: string
          phone_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          use_case?: string | null
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string
          contact_name?: string
          contact_title?: string | null
          created_at?: string | null
          estimated_users?: number | null
          id?: string
          organization_description?: string | null
          organization_name?: string
          phone_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          use_case?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          active_user_count: number | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          max_users: number | null
          name: string
          phone_number: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          subscription_tier: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          active_user_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name: string
          phone_number?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          active_user_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name?: string
          phone_number?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
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
          id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_text?: string
          id?: number
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
          id: number
          memo_text: string
          stage_number: number
          updated_at?: string
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string
          id?: number
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
      profile_with_email: {
        Row: {
          full_name: string | null
          id: string | null
          role: string | null
          user_email: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          role?: string | null
          user_email?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          role?: string | null
          user_email?: string | null
        }
        Relationships: []
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
          id: number
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
          id?: number
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
          id: number
          journal_shared?: boolean
          practitioner_user_id?: string | null
          sponsor_user_id?: string | null
          status?: string | null
        }
        Update: {
          id?: number
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
          id: number
          journal_entry_id?: number | null
        }
        Update: {
          connection_id?: number | null
          created_at?: string | null
          feedback_text?: string
          id?: number
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
            referencedRelation: "profiles"
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
          id: number
          memo_text?: string | null
          practitioner_updated_at?: string
          sponsor_read_at?: string | null
          stage_number: number
          user_id: string
          virtue_id: number
        }
        Update: {
          id?: number
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
          id: number
          prompt_text: string
          prompt_type: string
          stage_id?: number | null
        }
        Update: {
          id?: number
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
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: number
          message: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          status?: string
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
          id: number
          user_id?: string | null
          virtue_id?: number | null
        }
        Update: {
          id?: number
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
          id: number
          rating: number
          user_id: string
        }
        Update: {
          assessment_id?: number
          created_at?: string
          defect_name?: string
          harm_level?: string
          id?: number
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
          id: number
          priority_score: number
          user_id: string
          virtue_name: string
        }
        Update: {
          assessment_id?: number
          created_at?: string
          defect_intensity?: number | null
          id?: number
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
          id: number
          status?: string
          summary_analysis?: string | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          id?: number
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
          updated_at: string | null
          user_id: string
          virtue_id: number
        }
        Insert: {
          created_at?: string | null
          id: number
          memo_text?: string | null
          stage_number: number
          updated_at?: string | null
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          memo_text?: string | null
          stage_number?: number
          updated_at?: string | null
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
          id: number
          stage_number: number
          status?: string
          updated_at?: string
          user_id: string
          virtue_id: number
        }
        Update: {
          created_at?: string
          id?: number
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
          id: number
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
          id: number
          stage_number: number
          title?: string | null
          virtue_id?: number | null
        }
        Update: {
          id?: number
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
          id: number
          name: string
          short_description?: string | null
          story_of_virtue?: string | null
          virtue_guide?: string | null
        }
        Update: {
          author_reflection?: string | null
          description?: string | null
          id?: number
          name?: string
          short_description?: string | null
          story_of_virtue?: string | null
          virtue_guide?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_organization_request: {
        Args: { admin_notes?: string; request_id: string }
        Returns: {
          admin_user_id: string
          message: string
          organization_id: string
          success: boolean
        }[]
      }
      automated_monitoring_check: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_organizational_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          details: string
          metric: string
          status: string
          value: string
        }[]
      }
      cleanup_expired_reports: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      daily_health_check_report: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_organization_with_users: {
        Args: { admin_confirmation?: string; org_id: string }
        Returns: {
          deleted_users_count: number
          message: string
          success: boolean
        }[]
      }
      detect_organizational_issues: {
        Args: Record<PropertyKey, never>
        Returns: {
          affected_count: number
          description: string
          issue_type: string
          recommended_action: string
          severity: string
        }[]
      }
      generate_monitoring_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_level: string
          alert_message: string
          alert_timestamp: string
          metric_value: string
          threshold: string
        }[]
      }
      get_available_virtues_for_user: {
        Args: { target_user_id: string }
        Returns: {
          virtue_id: number
          virtue_name: string
        }[]
      }
      get_organization_activity_overview: {
        Args: { org_id: string }
        Returns: {
          created_at: string
          current_stage: number
          current_virtue_id: number
          days_since_activity: number
          email: string
          full_name: string
          is_active: boolean
          last_activity: string
          roles: string[]
          user_id: string
        }[]
      }
      get_virtue_stage_work_details: {
        Args: {
          end_date?: string
          start_date?: string
          status_filter?: string
          target_user_id: string
          virtue_ids?: number[]
        }
        Returns: {
          completed_at: string
          memo_text: string
          stage_number: number
          stage_title: string
          started_at: string
          status: string
          updated_at: string
          virtue_id: number
          virtue_name: string
        }[]
      }
      get_work_product_summary: {
        Args: {
          end_date?: string
          start_date?: string
          status_filter?: string
          target_user_id: string
        }
        Returns: {
          date_range_end: string
          date_range_start: string
          total_assessments: number
          total_journal_entries: number
          total_stages_completed: number
          total_stages_in_progress: number
          virtues_with_progress: number
        }[]
      }
      log_monitoring_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_message: string
          p_severity: string
        }
        Returns: undefined
      }
      monitor_organization_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          health_score: number
          organization_name: string
          recent_activity_users: number
          total_assignments: number
        }[]
      }
      monitor_organizational_query_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          calls: number
          max_time: number
          mean_time: number
          performance_status: string
          query_type: string
          total_time: number
        }[]
      }
      monitor_user_login_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_response_time: number
          success_rate: number
          time_period: string
          total_logins: number
          unique_users: number
        }[]
      }
      reject_organization_request: {
        Args: { rejection_reason: string; request_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
