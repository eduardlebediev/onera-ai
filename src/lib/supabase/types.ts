// TODO: Replace with generated Supabase types (`supabase gen types typescript`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
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
