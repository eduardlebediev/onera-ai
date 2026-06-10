// TODO: Replace with generated Supabase types (`supabase gen types typescript`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          source_type: string
          file_name: string | null
          file_url: string | null
          extracted_text: string | null
          status: string
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
          extracted_text?: string | null
          status?: string
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
          extracted_text?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
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
