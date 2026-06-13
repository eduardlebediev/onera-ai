// TODO: Replace with generated Supabase types (`supabase gen types typescript`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          invited_email: string | null
          role: string
          status: string
          department: string | null
          job_title: string | null
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          invited_email?: string | null
          role: string
          status?: string
          department?: string | null
          job_title?: string | null
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          invited_email?: string | null
          role?: string
          status?: string
          department?: string | null
          job_title?: string | null
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          source_type: string
          file_name: string | null
          file_url: string | null
          storage_path: string | null
          file_type: string | null
          file_size_mb: number | null
          extracted_text: string | null
          extraction_method: string | null
          processing_error: string | null
          processed_at: string | null
          status: string
          parent_document_id: string | null
          version_number: number
          is_latest: boolean
          replaced_by_document_id: string | null
          change_message: string | null
          ai_change_summary: string | null
          archived_at: string | null
          archived_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          source_type?: string
          file_name?: string | null
          file_url?: string | null
          storage_path?: string | null
          file_type?: string | null
          file_size_mb?: number | null
          extracted_text?: string | null
          extraction_method?: string | null
          processing_error?: string | null
          processed_at?: string | null
          status?: string
          parent_document_id?: string | null
          version_number?: number
          is_latest?: boolean
          replaced_by_document_id?: string | null
          change_message?: string | null
          ai_change_summary?: string | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          source_type?: string
          file_name?: string | null
          file_url?: string | null
          storage_path?: string | null
          file_type?: string | null
          file_size_mb?: number | null
          extracted_text?: string | null
          extraction_method?: string | null
          processing_error?: string | null
          processed_at?: string | null
          status?: string
          parent_document_id?: string | null
          version_number?: number
          is_latest?: boolean
          replaced_by_document_id?: string | null
          change_message?: string | null
          ai_change_summary?: string | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_version_events: {
        Row: {
          id: string
          organization_id: string
          document_id: string
          previous_document_id: string | null
          event_type: string
          created_by: string | null
          change_message: string | null
          ai_change_summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          document_id: string
          previous_document_id?: string | null
          event_type: string
          created_by?: string | null
          change_message?: string | null
          ai_change_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          document_id?: string
          previous_document_id?: string | null
          event_type?: string
          created_by?: string | null
          change_message?: string | null
          ai_change_summary?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ai_generation_runs: {
        Row: {
          id: string
          organization_id: string
          document_id: string | null
          test_id: string | null
          status: string
          model: string | null
          embedding_model: string | null
          input_config: Json
          retrieved_chunk_ids: string[]
          output_summary: Json
          error_message: string | null
          created_by: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          document_id?: string | null
          test_id?: string | null
          status?: string
          model?: string | null
          embedding_model?: string | null
          input_config?: Json
          retrieved_chunk_ids?: string[]
          output_summary?: Json
          error_message?: string | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          document_id?: string | null
          test_id?: string | null
          status?: string
          model?: string | null
          embedding_model?: string | null
          input_config?: Json
          retrieved_chunk_ids?: string[]
          output_summary?: Json
          error_message?: string | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      tests: {
        Row: {
          id: string
          organization_id: string
          source_document_id: string | null
          title: string
          description: string | null
          status: string
          difficulty: string
          language: string
          target_role: string | null
          question_count: number | null
          passing_score: number
          created_by: string | null
          published_at: string | null
          is_active: boolean
          source_validity: string
          source_invalid_reason: string | null
          source_invalid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          source_document_id?: string | null
          title: string
          description?: string | null
          status?: string
          difficulty?: string
          language?: string
          target_role?: string | null
          question_count?: number | null
          passing_score?: number
          created_by?: string | null
          published_at?: string | null
          is_active?: boolean
          source_validity?: string
          source_invalid_reason?: string | null
          source_invalid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          source_document_id?: string | null
          title?: string
          description?: string | null
          status?: string
          difficulty?: string
          language?: string
          target_role?: string | null
          question_count?: number | null
          passing_score?: number
          created_by?: string | null
          published_at?: string | null
          is_active?: boolean
          source_validity?: string
          source_invalid_reason?: string | null
          source_invalid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          id: string
          organization_id: string
          test_id: string
          source_chunk_id: string | null
          question_text: string
          question_type: string
          options: Json
          correct_answer: Json
          explanation: string | null
          topic: string | null
          difficulty: string | null
          order_index: number
          source_document_id: string | null
          is_active: boolean
          source_status: string
          source_invalid_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          test_id: string
          source_chunk_id?: string | null
          question_text: string
          question_type?: string
          options?: Json
          correct_answer?: Json
          explanation?: string | null
          topic?: string | null
          difficulty?: string | null
          order_index?: number
          source_document_id?: string | null
          is_active?: boolean
          source_status?: string
          source_invalid_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          test_id?: string
          source_chunk_id?: string | null
          question_text?: string
          question_type?: string
          options?: Json
          correct_answer?: Json
          explanation?: string | null
          topic?: string | null
          difficulty?: string | null
          order_index?: number
          source_document_id?: string | null
          is_active?: boolean
          source_status?: string
          source_invalid_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_assignments: {
        Row: {
          id: string
          organization_id: string
          test_id: string
          user_id: string
          assigned_by: string | null
          status: string
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          test_id: string
          user_id: string
          assigned_by?: string | null
          status?: string
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          test_id?: string
          user_id?: string
          assigned_by?: string | null
          status?: string
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          id: string
          organization_id: string
          test_id: string
          user_id: string
          assignment_id: string | null
          status: string
          score: number | null
          passed: boolean | null
          ai_feedback: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          test_id: string
          user_id: string
          assignment_id?: string | null
          status?: string
          score?: number | null
          passed?: boolean | null
          ai_feedback?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          test_id?: string
          user_id?: string
          assignment_id?: string | null
          status?: string
          score?: number | null
          passed?: boolean | null
          ai_feedback?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          id: string
          organization_id: string
          attempt_id: string
          question_id: string
          user_answer: Json
          is_correct: boolean | null
          ai_explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          attempt_id: string
          question_id: string
          user_answer?: Json
          is_correct?: boolean | null
          ai_explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          attempt_id?: string
          question_id?: string
          user_answer?: Json
          is_correct?: boolean | null
          ai_explanation?: string | null
          created_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          id: string
          organization_id: string
          document_id: string
          chunk_index: number
          title: string | null
          topic: string | null
          content: string
          token_count: number | null
          embedding: number[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          document_id: string
          chunk_index: number
          title?: string | null
          topic?: string | null
          content: string
          token_count?: number | null
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          document_id?: string
          chunk_index?: number
          title?: string | null
          topic?: string | null
          content?: string
          token_count?: number | null
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_topics: {
        Row: {
          id: string
          organization_id: string
          document_id: string
          topic: string
          description: string | null
          confidence: number | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          document_id: string
          topic: string
          description?: string | null
          confidence?: number | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          document_id?: string
          topic?: string
          description?: string | null
          confidence?: number | null
          source?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[]
          match_count?: number
          document_id_filter?: string | null
          organization_id_filter?: string | null
          match_threshold?: number
        }
        Returns: {
          id: string
          document_id: string
          title: string | null
          topic: string | null
          content: string
          similarity: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
