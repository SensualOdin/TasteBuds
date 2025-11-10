export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          invite_code: string | null;
          is_active: boolean;
          max_members: number;
          name: string;
          search_radius: number | null;
          search_zip: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          invite_code?: string | null;
          is_active?: boolean;
          max_members?: number;
          name: string;
          search_radius?: number | null;
          search_zip?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          invite_code?: string | null;
          is_active?: boolean;
          max_members?: number;
          name?: string;
          search_radius?: number | null;
          search_zip?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          matched_at: string;
          restaurant_id: string;
          session_id: string;
        };
        Insert: {
          id?: string;
          matched_at?: string;
          restaurant_id: string;
          session_id: string;
        };
        Update: {
          id?: string;
          matched_at?: string;
          restaurant_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string;
          created_at: string;
          cuisine: string[] | null;
          hours: Json | null;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          phone: string | null;
          photo_urls: string[] | null;
          place_id: string;
          price_level: number | null;
          rating: number | null;
          website: string | null;
          yelp_id: string | null;
        };
        Insert: {
          address: string;
          created_at?: string;
          cuisine?: string[] | null;
          hours?: Json | null;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          phone?: string | null;
          photo_urls?: string[] | null;
          place_id: string;
          price_level?: number | null;
          rating?: number | null;
          website?: string | null;
          yelp_id?: string | null;
        };
        Update: {
          address?: string;
          created_at?: string;
          cuisine?: string[] | null;
          hours?: Json | null;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          phone?: string | null;
          photo_urls?: string[] | null;
          place_id?: string;
          price_level?: number | null;
          rating?: number | null;
          website?: string | null;
          yelp_id?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          created_at: string;
          created_by: string;
          cuisine_filters: string[] | null;
          current_matches: number | null;
          group_id: string;
          id: string;
          location_lat: number;
          location_lng: number;
          max_matches: number | null;
          price_range_max: number | null;
          price_range_min: number | null;
          search_radius: number;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          cuisine_filters?: string[] | null;
          current_matches?: number | null;
          group_id: string;
          id?: string;
          location_lat: number;
          location_lng: number;
          max_matches?: number | null;
          price_range_max?: number | null;
          price_range_min?: number | null;
          search_radius?: number;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          cuisine_filters?: string[] | null;
          current_matches?: number | null;
          group_id?: string;
          id?: string;
          location_lat?: number;
          location_lng?: number;
          max_matches?: number | null;
          price_range_max?: number | null;
          price_range_min?: number | null;
          search_radius?: number;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      swipe_sessions: {
        Row: {
          created_at: string | null;
          group_id: string | null;
          id: string;
          radius: number;
          status: string | null;
          zip_code: string;
        };
        Insert: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          radius: number;
          status?: string | null;
          zip_code: string;
        };
        Update: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          radius?: number;
          status?: string | null;
          zip_code?: string;
        };
        Relationships: [];
      };
      swipes: {
        Row: {
          created_at: string;
          direction: string;
          id: string;
          restaurant_id: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          direction: string;
          id?: string;
          restaurant_id: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          direction?: string;
          id?: string;
          restaurant_id?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'swipes_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'swipes_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'swipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          cuisine_preferences: string[] | null;
          display_name: string;
          distance_preference: number | null;
          email: string;
          id: string;
          price_range_max: number | null;
          price_range_min: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          cuisine_preferences?: string[] | null;
          display_name: string;
          distance_preference?: number | null;
          email: string;
          id: string;
          price_range_max?: number | null;
          price_range_min?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          cuisine_preferences?: string[] | null;
          display_name?: string;
          distance_preference?: number | null;
          email?: string;
          id?: string;
          price_range_max?: number | null;
          price_range_min?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
