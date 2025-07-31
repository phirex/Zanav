export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      Booking: {
        Row: {
          createdAt: string
          dogId: number
          endDate: string
          exemptLastDay: boolean
          id: number
          ownerId: number
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          pricePerDay: number | null
          priceType: Database["public"]["Enums"]["PriceType"]
          roomId: number
          startDate: string
          status: Database["public"]["Enums"]["BookingStatus"]
          tenantId: string
          totalPrice: number | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          dogId: number
          endDate: string
          exemptLastDay?: boolean
          id?: number
          ownerId: number
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          pricePerDay?: number | null
          priceType: Database["public"]["Enums"]["PriceType"]
          roomId: number
          startDate: string
          status?: Database["public"]["Enums"]["BookingStatus"]
          tenantId: string
          totalPrice?: number | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          dogId?: number
          endDate?: string
          exemptLastDay?: boolean
          id?: number
          ownerId?: number
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"]
          pricePerDay?: number | null
          priceType?: Database["public"]["Enums"]["PriceType"]
          roomId?: number
          startDate?: string
          status?: Database["public"]["Enums"]["BookingStatus"]
          tenantId?: string
          totalPrice?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Booking_dogId_fkey"
            columns: ["dogId"]
            isOneToOne: false
            referencedRelation: "Dog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Booking_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "Owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Booking_roomId_fkey"
            columns: ["roomId"]
            isOneToOne: false
            referencedRelation: "Room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Booking_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientSource: {
        Row: {
          id: number
          name: string
          tenantId: string
        }
        Insert: {
          id: number
          name: string
          tenantId: string
        }
        Update: {
          id?: number
          name?: string
          tenantId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClientSource_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Dog: {
        Row: {
          breed: string
          createdAt: string
          currentRoomId: number | null
          id: number
          name: string
          ownerId: number
          specialNeeds: string | null
          tenantId: string
          updatedAt: string
        }
        Insert: {
          breed: string
          createdAt?: string
          currentRoomId?: number | null
          id?: number
          name: string
          ownerId: number
          specialNeeds?: string | null
          tenantId: string
          updatedAt?: string
        }
        Update: {
          breed?: string
          createdAt?: string
          currentRoomId?: number | null
          id?: number
          name?: string
          ownerId?: number
          specialNeeds?: string | null
          tenantId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Dog_currentRoomId_fkey"
            columns: ["currentRoomId"]
            isOneToOne: false
            referencedRelation: "Room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Dog_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "Owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Dog_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      GlobalAdmin: {
        Row: {
          createdAt: string | null
          email: string
          id: string
          name: string | null
          supabaseUserId: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          id?: string
          name?: string | null
          supabaseUserId: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          id?: string
          name?: string | null
          supabaseUserId?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      kennel_website_faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question: string
          sort_order: number | null
          website_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question: string
          sort_order?: number | null
          website_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question?: string
          sort_order?: number | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kennel_website_faqs_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "kennel_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_website_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          sort_order: number | null
          website_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          website_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kennel_website_images_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "kennel_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_website_testimonials: {
        Row: {
          author_name: string
          author_photo: string | null
          created_at: string | null
          featured: boolean | null
          id: string
          sort_order: number | null
          text: string
          website_id: string
        }
        Insert: {
          author_name: string
          author_photo?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          sort_order?: number | null
          text: string
          website_id: string
        }
        Update: {
          author_name?: string
          author_photo?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          sort_order?: number | null
          text?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kennel_website_testimonials_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "kennel_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_website_videos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          video_url: string
          website_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          video_url: string
          website_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          video_url?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kennel_website_videos_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "kennel_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_websites: {
        Row: {
          address: string | null
          allow_direct_booking: boolean | null
          contact_email: string | null
          contact_phone: string | null
          contact_social: Json | null
          contact_whatsapp: string | null
          cover_photo_url: string | null
          created_at: string | null
          hero_tagline: string | null
          hero_title: string | null
          id: string
          map_embed_url: string | null
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          special_restrictions: string | null
          subdomain: string
          tenant_id: string
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allow_direct_booking?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_social?: Json | null
          contact_whatsapp?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          hero_tagline?: string | null
          hero_title?: string | null
          id?: string
          map_embed_url?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          special_restrictions?: string | null
          subdomain: string
          tenant_id: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allow_direct_booking?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_social?: Json | null
          contact_whatsapp?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          hero_tagline?: string | null
          hero_title?: string | null
          id?: string
          map_embed_url?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          special_restrictions?: string | null
          subdomain?: string
          tenant_id?: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kennel_websites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      NotificationTemplate: {
        Row: {
          active: boolean
          body: string
          createdAt: string
          delayHours: number
          description: string | null
          id: string
          name: string
          subject: string
          tenantId: string
          trigger: Database["public"]["Enums"]["TriggerType"]
          updatedAt: string
        }
        Insert: {
          active?: boolean
          body: string
          createdAt?: string
          delayHours?: number
          description?: string | null
          id?: string
          name: string
          subject: string
          tenantId: string
          trigger: Database["public"]["Enums"]["TriggerType"]
          updatedAt?: string
        }
        Update: {
          active?: boolean
          body?: string
          createdAt?: string
          delayHours?: number
          description?: string | null
          id?: string
          name?: string
          subject?: string
          tenantId?: string
          trigger?: Database["public"]["Enums"]["TriggerType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "NotificationTemplate_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Owner: {
        Row: {
          address: string | null
          clientSourceId: number | null
          createdAt: string
          email: string | null
          id: number
          name: string
          phone: string
          tenantId: string
          updatedAt: string
        }
        Insert: {
          address?: string | null
          clientSourceId?: number | null
          createdAt?: string
          email?: string | null
          id?: number
          name: string
          phone: string
          tenantId: string
          updatedAt?: string
        }
        Update: {
          address?: string | null
          clientSourceId?: number | null
          createdAt?: string
          email?: string | null
          id?: number
          name?: string
          phone?: string
          tenantId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_client_source_fk"
            columns: ["clientSourceId", "tenantId"]
            isOneToOne: false
            referencedRelation: "ClientSource"
            referencedColumns: ["id", "tenantId"]
          },
          {
            foreignKeyName: "Owner_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Payment: {
        Row: {
          amount: number
          bookingId: number
          createdAt: string
          id: number
          method: Database["public"]["Enums"]["PaymentMethod"]
          tenantId: string
          updatedAt: string
        }
        Insert: {
          amount: number
          bookingId: number
          createdAt?: string
          id?: number
          method: Database["public"]["Enums"]["PaymentMethod"]
          tenantId: string
          updatedAt?: string
        }
        Update: {
          amount?: number
          bookingId?: number
          createdAt?: string
          id?: number
          method?: Database["public"]["Enums"]["PaymentMethod"]
          tenantId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payment_bookingId_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "Booking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payment_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Room: {
        Row: {
          capacity: number
          createdAt: string
          displayName: string
          id: number
          maxCapacity: number
          name: string
          tenantId: string
          updatedAt: string
        }
        Insert: {
          capacity?: number
          createdAt?: string
          displayName?: string
          id?: number
          maxCapacity?: number
          name: string
          tenantId: string
          updatedAt?: string
        }
        Update: {
          capacity?: number
          createdAt?: string
          displayName?: string
          id?: number
          maxCapacity?: number
          name?: string
          tenantId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Room_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      ScheduledNotification: {
        Row: {
          attempts: number
          bookingId: number
          createdAt: string
          id: string
          lastAttemptAt: string | null
          lastError: string | null
          recipient: string
          scheduledFor: string
          sent: boolean
          sentAt: string | null
          templateId: string
          tenantId: string
          updatedAt: string
          variables: Json
        }
        Insert: {
          attempts?: number
          bookingId: number
          createdAt?: string
          id?: string
          lastAttemptAt?: string | null
          lastError?: string | null
          recipient: string
          scheduledFor: string
          sent?: boolean
          sentAt?: string | null
          templateId: string
          tenantId: string
          updatedAt?: string
          variables: Json
        }
        Update: {
          attempts?: number
          bookingId?: number
          createdAt?: string
          id?: string
          lastAttemptAt?: string | null
          lastError?: string | null
          recipient?: string
          scheduledFor?: string
          sent?: boolean
          sentAt?: string | null
          templateId?: string
          tenantId?: string
          updatedAt?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ScheduledNotification_bookingId_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "Booking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledNotification_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "NotificationTemplate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledNotification_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Setting: {
        Row: {
          createdAt: string
          key: string
          tenantId: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          key: string
          tenantId: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          key?: string
          tenantId?: string
          updatedAt?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "Setting_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      Tenant: {
        Row: {
          createdAt: string
          id: string
          name: string
          subdomain: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          name: string
          subdomain?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          subdomain?: string | null
        }
        Relationships: []
      }
      User: {
        Row: {
          createdAt: string
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          name: string | null
          supabaseUserId: string | null
          tenantId: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          name?: string | null
          supabaseUserId?: string | null
          tenantId?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          name?: string | null
          supabaseUserId?: string | null
          tenantId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      UserTenant: {
        Row: {
          role: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          role?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          role?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserTenant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "Tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserTenant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      BookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED"
      PaymentMethod: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "BIT"
      PriceType: "DAILY" | "FIXED"
      TriggerType:
        | "BOOKING_CONFIRMATION"
        | "BOOKING_REMINDER"
        | "CHECK_IN_REMINDER"
        | "CHECK_OUT_REMINDER"
        | "PAYMENT_REMINDER"
        | "CUSTOM"
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
      BookingStatus: ["PENDING", "CONFIRMED", "CANCELLED"],
      PaymentMethod: ["CASH", "CREDIT_CARD", "BANK_TRANSFER", "BIT"],
      PriceType: ["DAILY", "FIXED"],
      TriggerType: [
        "BOOKING_CONFIRMATION",
        "BOOKING_REMINDER",
        "CHECK_IN_REMINDER",
        "CHECK_OUT_REMINDER",
        "PAYMENT_REMINDER",
        "CUSTOM",
      ],
    },
  },
} as const
