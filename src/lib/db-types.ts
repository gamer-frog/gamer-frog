/**
 * Tipos Database para Supabase. Mapean las tablas del schema creado por el usuario.
 * Permiten autocompletado y tipado fuerte en el cliente Supabase.
 */
export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          icon: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          name: string;
          slug: string;
          department_id: string | null;
          provider: string;
          model: string;
          description: string | null;
          avatar_emoji: string;
          visual_state: string;
          active: boolean;
          github_path: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          department_id?: string | null;
          provider?: string;
          model?: string;
          description?: string | null;
          avatar_emoji?: string;
          visual_state?: string;
          active?: boolean;
          github_path?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          department_id: string | null;
          assigned_agent_id: string | null;
          status: string;
          priority: number;
          source: string;
          github_path: string | null;
          input_payload: Record<string, unknown> | null;
          output_payload: Record<string, unknown> | null;
          human_feedback: string | null;
          due_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          department_id?: string | null;
          assigned_agent_id?: string | null;
          status?: string;
          priority?: number;
          source?: string;
          github_path?: string | null;
          input_payload?: Record<string, unknown> | null;
          output_payload?: Record<string, unknown> | null;
          human_feedback?: string | null;
          due_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      task_events: {
        Row: {
          id: string;
          task_id: string | null;
          agent_id: string | null;
          event_type: string;
          message: string;
          payload: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          agent_id?: string | null;
          event_type: string;
          message: string;
          payload?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_events"]["Insert"]>;
      };
      agent_presence: {
        Row: {
          id: string;
          agent_id: string;
          state: string;
          zone: string;
          current_task_id: string | null;
          heartbeat_at: string | null;
          extra: Record<string, unknown> | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          state?: string;
          zone?: string;
          current_task_id?: string | null;
          heartbeat_at?: string | null;
          extra?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_presence"]["Insert"]>;
      };
      daily_memos: {
        Row: {
          id: string;
          memo_date: string;
          department_id: string | null;
          markdown: string;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memo_date: string;
          department_id?: string | null;
          markdown: string;
          generated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_memos"]["Insert"]>;
      };
      cron_jobs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          agent_id: string | null;
          schedule: string;
          provider: string;
          last_run_at: string | null;
          last_status: string | null;
          last_output: string | null;
          active: boolean;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          agent_id?: string | null;
          schedule?: string;
          provider?: string;
          last_run_at?: string | null;
          last_status?: string | null;
          last_output?: string | null;
          active?: boolean;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["cron_jobs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
