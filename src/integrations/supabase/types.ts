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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_status: string | null
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount_amount: number
          discount_code_id: string | null
          duration_minutes: number
          final_amount: number | null
          guest_count: number
          id: string
          payment_status: string | null
          price_amount: number
          service_type: string
          session_date: string
          session_time: string
          special_requests: string | null
          stripe_payment_id: string | null
          stripe_session_id: string | null
          time_slot_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_status?: string | null
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number
          discount_code_id?: string | null
          duration_minutes: number
          final_amount?: number | null
          guest_count?: number
          id?: string
          payment_status?: string | null
          price_amount: number
          service_type: string
          session_date: string
          session_time: string
          special_requests?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          time_slot_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_status?: string | null
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number
          discount_code_id?: string | null
          duration_minutes?: number
          final_amount?: number | null
          guest_count?: number
          id?: string
          payment_status?: string | null
          price_amount?: number
          service_type?: string
          session_date?: string
          session_time?: string
          special_requests?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          time_slot_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credits: {
        Row: {
          created_at: string
          credit_balance: number
          customer_email: string
          expires_at: string
          gift_card_id: string | null
          id: string
          redeemed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          customer_email: string
          expires_at?: string
          gift_card_id?: string | null
          id?: string
          redeemed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          customer_email?: string
          expires_at?: string
          gift_card_id?: string | null
          id?: string
          redeemed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tokens: {
        Row: {
          created_at: string
          customer_email: string
          expires_at: string | null
          id: string
          notes: string | null
          tokens_remaining: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          tokens_remaining?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          tokens_remaining?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_amount: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      discount_redemptions: {
        Row: {
          created_at: string
          discount_amount: number
          discount_code_id: string
          entity_id: string
          entity_type: string
          final_amount: number
          id: string
          original_amount: number
        }
        Insert: {
          created_at?: string
          discount_amount: number
          discount_code_id: string
          entity_id: string
          entity_type: string
          final_amount: number
          id?: string
          original_amount: number
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_code_id?: string
          entity_id?: string
          entity_type?: string
          final_amount?: number
          id?: string
          original_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          additional_info: Json | null
          created_at: string
          display_order: number | null
          event_dates: string[] | null
          event_time: string | null
          full_description: string | null
          id: string
          image_url: string | null
          instructor: string | null
          is_published: boolean | null
          secondary_image_url: string | null
          short_description: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          display_order?: number | null
          event_dates?: string[] | null
          event_time?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          is_published?: boolean | null
          secondary_image_url?: string | null
          short_description?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          display_order?: number | null
          event_dates?: string[] | null
          event_time?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          is_published?: boolean | null
          secondary_image_url?: string | null
          short_description?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          amount: number
          created_at: string
          discount_amount: number
          discount_code_id: string | null
          expires_at: string | null
          final_amount: number | null
          gift_code: string
          id: string
          is_redeemed: boolean | null
          message: string | null
          payment_status: string | null
          purchaser_email: string
          purchaser_name: string
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          discount_amount?: number
          discount_code_id?: string | null
          expires_at?: string | null
          final_amount?: number | null
          gift_code?: string
          id?: string
          is_redeemed?: boolean | null
          message?: string | null
          payment_status?: string | null
          purchaser_email: string
          purchaser_name: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          discount_amount?: number
          discount_code_id?: string | null
          expires_at?: string | null
          final_amount?: number | null
          gift_code?: string
          id?: string
          is_redeemed?: boolean | null
          message?: string | null
          payment_status?: string | null
          purchaser_email?: string
          purchaser_name?: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          discount_amount: number
          discount_code_id: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          is_auto_renew: boolean | null
          last_session_reset: string | null
          membership_type: string
          price_amount: number | null
          sessions_per_week: number
          sessions_remaining: number | null
          start_date: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_amount?: number
          discount_code_id?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_auto_renew?: boolean | null
          last_session_reset?: string | null
          membership_type: string
          price_amount?: number | null
          sessions_per_week: number
          sessions_remaining?: number | null
          start_date?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_amount?: number
          discount_code_id?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_auto_renew?: boolean | null
          last_session_reset?: string | null
          membership_type?: string
          price_amount?: number | null
          sessions_per_week?: number
          sessions_remaining?: number | null
          start_date?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_codes: {
        Row: {
          company_name: string
          created_at: string
          discount_percentage: number
          id: string
          is_active: boolean
          promo_code: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          discount_percentage: number
          id?: string
          is_active?: boolean
          promo_code: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          promo_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_email_log: {
        Row: {
          email: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          email: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          email?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          price_amount: number
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          price_amount: number
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          price_amount?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booked_count: number | null
          capacity: number | null
          created_at: string
          id: string
          is_available: boolean | null
          service_type: string
          slot_date: string
          slot_time: string
          updated_at: string
        }
        Insert: {
          booked_count?: number | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          service_type: string
          slot_date: string
          slot_time: string
          updated_at?: string
        }
        Update: {
          booked_count?: number | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          service_type?: string
          slot_date?: string
          slot_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_booking: {
        Args: { p_stripe_session_id: string; p_time_slot_id: string }
        Returns: boolean
      }
      expire_old_memberships: { Args: never; Returns: undefined }
      generate_time_slots: {
        Args: { end_date: string; start_date: string }
        Returns: undefined
      }
      get_available_communal_spaces: {
        Args: { p_time_slot_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      reset_weekly_sessions: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_type: "communal" | "private"
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
      app_role: ["admin", "user"],
      booking_type: ["communal", "private"],
    },
  },
} as const
