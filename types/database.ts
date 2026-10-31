// Mirrors supabase/migrations/001_init.sql in the shape `supabase gen types`
// produces. Regenerate with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          college: string;
          github_username: string;
          avatar_url: string | null;
          bio: string | null;
          primary_role: string;
          verified_skills: Json | null;
          github_stats: Json | null;
          is_looking_for_team: boolean | null;
          onboarded: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          college?: string;
          github_username: string;
          avatar_url?: string | null;
          bio?: string | null;
          primary_role: string;
          verified_skills?: Json | null;
          github_stats?: Json | null;
          is_looking_for_team?: boolean | null;
          onboarded?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          college?: string;
          github_username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          primary_role?: string;
          verified_skills?: Json | null;
          github_stats?: Json | null;
          is_looking_for_team?: boolean | null;
          onboarded?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          organizer: string;
          description: string | null;
          themes: string[];
          registration_deadline: string;
          event_start: string;
          team_min_size: number | null;
          team_max_size: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          organizer: string;
          description?: string | null;
          themes?: string[];
          registration_deadline: string;
          event_start: string;
          team_min_size?: number | null;
          team_max_size?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          organizer?: string;
          description?: string | null;
          themes?: string[];
          registration_deadline?: string;
          event_start?: string;
          team_min_size?: number | null;
          team_max_size?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          event_id: string;
          leader_id: string;
          team_name: string;
          pitch: string | null;
          target_roles: string[];
          tech_stack: string[];
          is_locked: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          leader_id: string;
          team_name: string;
          pitch?: string | null;
          target_roles?: string[];
          tech_stack?: string[];
          is_locked?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          leader_id?: string;
          team_name?: string;
          pitch?: string | null;
          target_roles?: string[];
          tech_stack?: string[];
          is_locked?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role_assigned: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role_assigned: string;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role_assigned?: string;
          joined_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          event_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          event_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          direction: Database["public"]["Enums"]["invite_direction"];
          status: Database["public"]["Enums"]["invite_status"] | null;
          expires_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          direction: Database["public"]["Enums"]["invite_direction"];
          status?: Database["public"]["Enums"]["invite_status"] | null;
          expires_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          direction?: Database["public"]["Enums"]["invite_direction"];
          status?: Database["public"]["Enums"]["invite_status"] | null;
          expires_at?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invites_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_team: {
        Args: {
          p_event_id: string;
          p_team_name: string;
          p_pitch: string;
          p_target_roles: string[];
          p_tech_stack: string[];
        };
        Returns: Json;
      };
      send_team_invite: {
        Args: {
          p_team_id: string;
          p_user_id: string;
          p_direction: Database["public"]["Enums"]["invite_direction"];
        };
        Returns: Json;
      };
      accept_team_invite: {
        Args: { p_invite_id: string };
        Returns: Json;
      };
      decline_team_invite: {
        Args: { p_invite_id: string };
        Returns: Json;
      };
      leave_team: {
        Args: { p_team_id: string };
        Returns: Json;
      };
      delete_team: {
        Args: { p_team_id: string };
        Returns: Json;
      };
      remove_team_member: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: Json;
      };
      expire_stale_invites: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      invite_status: "pending" | "accepted" | "declined" | "expired";
      invite_direction: "team_to_user" | "user_to_team";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
