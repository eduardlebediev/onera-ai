export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          embedding_model: string | null
          error_message: string | null
          id: string
          input_config: Json
          model: string | null
          organization_id: string
          output_summary: Json
          retrieved_chunk_ids: string[]
          status: string
          test_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          embedding_model?: string | null
          error_message?: string | null
          id?: string
          input_config?: Json
          model?: string | null
          organization_id: string
          output_summary?: Json
          retrieved_chunk_ids?: string[]
          status?: string
          test_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          embedding_model?: string | null
          error_message?: string | null
          id?: string
          input_config?: Json
          model?: string | null
          organization_id?: string
          output_summary?: Json
          retrieved_chunk_ids?: string[]
          status?: string
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          organization_id: string
          title: string | null
          token_count: number | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          title?: string | null
          token_count?: number | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          title?: string | null
          token_count?: number | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_organization_id_fkey"
            columns: ["document_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "document_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_topics: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          document_id: string
          id: string
          organization_id: string
          source: string
          topic: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          document_id: string
          id?: string
          organization_id: string
          source?: string
          topic: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          document_id?: string
          id?: string
          organization_id?: string
          source?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_topics_document_id_organization_id_fkey"
            columns: ["document_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "document_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_version_events: {
        Row: {
          ai_change_summary: string | null
          change_message: string | null
          created_at: string
          created_by: string | null
          document_id: string
          event_type: string
          id: string
          organization_id: string
          previous_document_id: string | null
        }
        Insert: {
          ai_change_summary?: string | null
          change_message?: string | null
          created_at?: string
          created_by?: string | null
          document_id: string
          event_type: string
          id?: string
          organization_id: string
          previous_document_id?: string | null
        }
        Update: {
          ai_change_summary?: string | null
          change_message?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string
          event_type?: string
          id?: string
          organization_id?: string
          previous_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_version_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_version_events_document_id_organization_id_fkey"
            columns: ["document_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "document_version_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_version_events_previous_document_id_fkey"
            columns: ["previous_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_change_summary: string | null
          archived_at: string | null
          archived_by: string | null
          change_message: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          extracted_text: string | null
          extraction_method: string | null
          file_name: string | null
          file_size_mb: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_latest: boolean
          organization_id: string
          parent_document_id: string | null
          processed_at: string | null
          processing_error: string | null
          replaced_by_document_id: string | null
          source_type: string
          status: string
          storage_path: string | null
          title: string
          updated_at: string
          version_number: number
        }
        Insert: {
          ai_change_summary?: string | null
          archived_at?: string | null
          archived_by?: string | null
          change_message?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          extracted_text?: string | null
          extraction_method?: string | null
          file_name?: string | null
          file_size_mb?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_latest?: boolean
          organization_id: string
          parent_document_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          replaced_by_document_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          title: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          ai_change_summary?: string | null
          archived_at?: string | null
          archived_by?: string | null
          change_message?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          extracted_text?: string | null
          extraction_method?: string | null
          file_name?: string | null
          file_size_mb?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_latest?: boolean
          organization_id?: string
          parent_document_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          replaced_by_document_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_replaced_by_document_id_fkey"
            columns: ["replaced_by_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_nudge_events: {
        Row: {
          channel: string
          created_at: string
          employee_user_id: string
          id: string
          nudged_by: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          employee_user_id: string
          id?: string
          nudged_by?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          employee_user_id?: string
          id?: string
          nudged_by?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_nudge_events_employee_user_id_fkey"
            columns: ["employee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_nudge_events_nudged_by_fkey"
            columns: ["nudged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_nudge_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_answers: {
        Row: {
          created_at: string
          follow_up_question_id: string
          id: string
          is_correct: boolean
          organization_id: string
          user_answer: Json
        }
        Insert: {
          created_at?: string
          follow_up_question_id: string
          id?: string
          is_correct: boolean
          organization_id: string
          user_answer?: Json
        }
        Update: {
          created_at?: string
          follow_up_question_id?: string
          id?: string
          is_correct?: boolean
          organization_id?: string
          user_answer?: Json
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_answers_follow_up_question_id_organization_id_fkey"
            columns: ["follow_up_question_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "follow_up_questions"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "follow_up_answers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_questions: {
        Row: {
          attempt_id: string
          correct_answer: Json
          created_at: string
          difficulty: string
          explanation_after_answer: string
          explanation_before_question: string
          id: string
          learning_goal: string
          options: Json
          organization_id: string
          original_question_id: string
          question_text: string
          source_chunk_reference: string
          topic: string
        }
        Insert: {
          attempt_id: string
          correct_answer?: Json
          created_at?: string
          difficulty: string
          explanation_after_answer: string
          explanation_before_question: string
          id?: string
          learning_goal: string
          options?: Json
          organization_id: string
          original_question_id: string
          question_text: string
          source_chunk_reference?: string
          topic: string
        }
        Update: {
          attempt_id?: string
          correct_answer?: Json
          created_at?: string
          difficulty?: string
          explanation_after_answer?: string
          explanation_before_question?: string
          id?: string
          learning_goal?: string
          options?: Json
          organization_id?: string
          original_question_id?: string
          question_text?: string
          source_chunk_reference?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_questions_attempt_id_organization_id_fkey"
            columns: ["attempt_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "follow_up_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_questions_original_question_id_organization_id_fkey"
            columns: ["original_question_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          department: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          invited_email: string | null
          job_title: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          job_title?: string | null
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          job_title?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          ai_explanation: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          organization_id: string
          question_id: string
          user_answer: Json
        }
        Insert: {
          ai_explanation?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          organization_id: string
          question_id: string
          user_answer?: Json
        }
        Update: {
          ai_explanation?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          organization_id?: string
          question_id?: string
          user_answer?: Json
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_organization_id_fkey"
            columns: ["attempt_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "test_answers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_organization_id_fkey"
            columns: ["question_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      test_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          deadline: string | null
          id: string
          organization_id: string
          status: string
          test_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          organization_id: string
          status?: string
          test_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          organization_id?: string
          status?: string
          test_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_test_id_organization_id_fkey"
            columns: ["test_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "test_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          ai_feedback: string | null
          assignment_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          organization_id: string
          passed: boolean | null
          score: number | null
          started_at: string | null
          status: string
          test_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          passed?: boolean | null
          score?: number | null
          started_at?: string | null
          status?: string
          test_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string | null
          status?: string
          test_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "test_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_organization_id_fkey"
            columns: ["test_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_documents: {
        Row: {
          created_at: string
          document_id: string
          organization_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          organization_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          organization_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_documents_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: Json
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          order_index: number
          organization_id: string
          question_text: string
          question_type: string
          review_status: string
          source_chunk_id: string | null
          source_document_id: string | null
          source_invalid_reason: string | null
          source_status: string
          test_id: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          correct_answer?: Json
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          order_index?: number
          organization_id: string
          question_text: string
          question_type?: string
          review_status?: string
          source_chunk_id?: string | null
          source_document_id?: string | null
          source_invalid_reason?: string | null
          source_status?: string
          test_id: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          order_index?: number
          organization_id?: string
          question_text?: string
          question_type?: string
          review_status?: string
          source_chunk_id?: string | null
          source_document_id?: string | null
          source_invalid_reason?: string | null
          source_status?: string
          test_id?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_organization_id_fkey"
            columns: ["test_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          language: string
          organization_id: string
          passing_score: number
          published_at: string | null
          question_count: number | null
          source_document_id: string | null
          source_invalid_at: string | null
          source_invalid_reason: string | null
          source_validity: string
          status: string
          target_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          language?: string
          organization_id: string
          passing_score?: number
          published_at?: string | null
          question_count?: number | null
          source_document_id?: string | null
          source_invalid_at?: string | null
          source_invalid_reason?: string | null
          source_validity?: string
          status?: string
          target_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          language?: string
          organization_id?: string
          passing_score?: number
          published_at?: string | null
          question_count?: number | null
          source_document_id?: string | null
          source_invalid_at?: string | null
          source_invalid_reason?: string | null
          source_validity?: string
          status?: string
          target_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_active_org_member: { Args: { org_id: string }; Returns: boolean }
      is_assigned_published_test: {
        Args: { test_id: string }
        Returns: boolean
      }
      is_assigned_test: { Args: { test_id: string }; Returns: boolean }
      match_document_chunks: {
        Args: {
          document_id_filter?: string
          match_count?: number
          match_threshold?: number
          organization_id_filter?: string
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
          title: string
          topic: string
        }[]
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
