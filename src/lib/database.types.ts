export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      Booking: {
        Row: {
          createdAt: string;
          dogId: number;
          endDate: string;
          exemptLastDay: boolean;
          id: number;
          ownerId: number;
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"];
          pricePerDay: number | null;
          priceType: Database["public"]["Enums"]["PriceType"];
          roomId: number;
          startDate: string;
          status: Database["public"]["Enums"]["BookingStatus"];
          tenantId: string | null;
          totalPrice: number | null;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          dogId: number;
          endDate: string;
          exemptLastDay?: boolean;
          id?: number;
          ownerId: number;
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"];
          pricePerDay?: number | null;
          priceType: Database["public"]["Enums"]["PriceType"];
          roomId: number;
          startDate: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          tenantId?: string | null;
          totalPrice?: number | null;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          dogId?: number;
          endDate?: string;
          exemptLastDay?: boolean;
          id?: number;
          ownerId?: number;
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"];
          pricePerDay?: number | null;
          priceType?: Database["public"]["Enums"]["PriceType"];
          roomId?: number;
          startDate?: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          tenantId?: string | null;
          totalPrice?: number | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Booking_dogId_fkey";
            columns: ["dogId"];
            isOneToOne: false;
            referencedRelation: "Dog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Booking_ownerId_fkey";
            columns: ["ownerId"];
            isOneToOne: false;
            referencedRelation: "Owner";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Booking_roomId_fkey";
            columns: ["roomId"];
            isOneToOne: false;
            referencedRelation: "Room";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Booking_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      Dog: {
        Row: {
          breed: string;
          createdAt: string;
          currentRoomId: number | null;
          id: number;
          name: string;
          ownerId: number;
          specialNeeds: string | null;
          tenantId: string | null;
          updatedAt: string;
        };
        Insert: {
          breed: string;
          createdAt?: string;
          currentRoomId?: number | null;
          id?: number;
          name: string;
          ownerId: number;
          specialNeeds?: string | null;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Update: {
          breed?: string;
          createdAt?: string;
          currentRoomId?: number | null;
          id?: number;
          name?: string;
          ownerId?: number;
          specialNeeds?: string | null;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Dog_currentRoomId_fkey";
            columns: ["currentRoomId"];
            isOneToOne: false;
            referencedRelation: "Room";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Dog_ownerId_fkey";
            columns: ["ownerId"];
            isOneToOne: false;
            referencedRelation: "Owner";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Dog_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      NotificationTemplate: {
        Row: {
          active: boolean;
          body: string;
          createdAt: string;
          delayHours: number;
          description: string | null;
          id: string;
          name: string;
          subject: string;
          tenantId: string | null;
          trigger: Database["public"]["Enums"]["TriggerType"];
          updatedAt: string;
        };
        Insert: {
          active?: boolean;
          body: string;
          createdAt?: string;
          delayHours?: number;
          description?: string | null;
          id?: string;
          name: string;
          subject: string;
          tenantId?: string | null;
          trigger: Database["public"]["Enums"]["TriggerType"];
          updatedAt?: string;
        };
        Update: {
          active?: boolean;
          body?: string;
          createdAt?: string;
          delayHours?: number;
          description?: string | null;
          id?: string;
          name?: string;
          subject?: string;
          tenantId?: string | null;
          trigger?: Database["public"]["Enums"]["TriggerType"];
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Template_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      Owner: {
        Row: {
          address: string | null;
          createdAt: string;
          email: string | null;
          id: number;
          name: string;
          phone: string;
          tenantId: string | null;
          updatedAt: string;
        };
        Insert: {
          address?: string | null;
          createdAt?: string;
          email?: string | null;
          id?: number;
          name: string;
          phone: string;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Update: {
          address?: string | null;
          createdAt?: string;
          email?: string | null;
          id?: number;
          name?: string;
          phone?: string;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Owner_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      Payment: {
        Row: {
          amount: number;
          bookingId: number;
          createdAt: string;
          id: number;
          method: Database["public"]["Enums"]["PaymentMethod"];
          tenantId: string | null;
          updatedAt: string;
        };
        Insert: {
          amount: number;
          bookingId: number;
          createdAt?: string;
          id?: number;
          method: Database["public"]["Enums"]["PaymentMethod"];
          tenantId?: string | null;
          updatedAt?: string;
        };
        Update: {
          amount?: number;
          bookingId?: number;
          createdAt?: string;
          id?: number;
          method?: Database["public"]["Enums"]["PaymentMethod"];
          tenantId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Payment_bookingId_fkey";
            columns: ["bookingId"];
            isOneToOne: false;
            referencedRelation: "Booking";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Payment_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      Room: {
        Row: {
          capacity: number;
          createdAt: string;
          displayName: string;
          id: number;
          maxCapacity: number;
          name: string;
          tenantId: string | null;
          updatedAt: string;
        };
        Insert: {
          capacity?: number;
          createdAt?: string;
          displayName?: string;
          id?: number;
          maxCapacity?: number;
          name: string;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Update: {
          capacity?: number;
          createdAt?: string;
          displayName?: string;
          id?: number;
          maxCapacity?: number;
          name?: string;
          tenantId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Room_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      ScheduledNotification: {
        Row: {
          attempts: number;
          bookingId: number;
          createdAt: string;
          id: string;
          lastAttemptAt: string | null;
          lastError: string | null;
          recipient: string;
          scheduledFor: string;
          sent: boolean;
          sentAt: string | null;
          templateId: string;
          tenantId: string | null;
          updatedAt: string;
          variables: Json;
        };
        Insert: {
          attempts?: number;
          bookingId: number;
          createdAt?: string;
          id?: string;
          lastAttemptAt?: string | null;
          lastError?: string | null;
          recipient: string;
          scheduledFor: string;
          sent?: boolean;
          sentAt?: string | null;
          templateId: string;
          tenantId?: string | null;
          updatedAt?: string;
          variables: Json;
        };
        Update: {
          attempts?: number;
          bookingId?: number;
          createdAt?: string;
          id?: string;
          lastAttemptAt?: string | null;
          lastError?: string | null;
          recipient?: string;
          scheduledFor?: string;
          sent?: boolean;
          sentAt?: string | null;
          templateId?: string;
          tenantId?: string | null;
          updatedAt?: string;
          variables?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "SchedNotif_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ScheduledNotification_bookingId_fkey";
            columns: ["bookingId"];
            isOneToOne: false;
            referencedRelation: "Booking";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ScheduledNotification_templateId_fkey";
            columns: ["templateId"];
            isOneToOne: false;
            referencedRelation: "NotificationTemplate";
            referencedColumns: ["id"];
          },
        ];
      };
      Setting: {
        Row: {
          createdAt: string;
          key: string;
          tenantId: string;
          updatedAt: string;
          value: string;
        };
        Insert: {
          createdAt?: string;
          key: string;
          tenantId: string;
          updatedAt?: string;
          value: string;
        };
        Update: {
          createdAt?: string;
          key?: string;
          tenantId?: string;
          updatedAt?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Setting_tenant_fkey";
            columns: ["tenantId"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      Tenant: {
        Row: {
          createdat: string;
          id: string;
          name: string;
          subdomain: string | null;
        };
        Insert: {
          createdat?: string;
          id?: string;
          name: string;
          subdomain?: string | null;
        };
        Update: {
          createdat?: string;
          id?: string;
          name?: string;
          subdomain?: string | null;
        };
        Relationships: [];
      };
      User: {
        Row: {
          createdAt: string;
          email: string | null;
          firstName: string | null;
          id: string;
          lastName: string | null;
          name: string | null;
          supabaseUserId: string | null;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          email?: string | null;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          name?: string | null;
          supabaseUserId?: string | null;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          email?: string | null;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          name?: string | null;
          supabaseUserId?: string | null;
          updatedAt?: string;
        };
        Relationships: [];
      };
      UserTenant: {
        Row: {
          role: string | null;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          role?: string | null;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          role?: string | null;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "UserTenant_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      kennel_websites: {
        Row: {
          id: string;
          tenant_id: string;
          subdomain: string;
          cover_photo_url: string | null;
          hero_title: string | null;
          hero_tagline: string | null;
          allow_direct_booking: boolean;
          theme_color: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_image_url: string | null;
          address: string | null;
          map_embed_url: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          contact_whatsapp: string | null;
          contact_social: Json | null;
          special_restrictions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          subdomain: string;
          cover_photo_url?: string | null;
          hero_title?: string | null;
          hero_tagline?: string | null;
          allow_direct_booking?: boolean;
          theme_color?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image_url?: string | null;
          address?: string | null;
          map_embed_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          contact_whatsapp?: string | null;
          contact_social?: Json | null;
          special_restrictions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          subdomain?: string;
          cover_photo_url?: string | null;
          hero_title?: string | null;
          hero_tagline?: string | null;
          allow_direct_booking?: boolean;
          theme_color?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image_url?: string | null;
          address?: string | null;
          map_embed_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          contact_whatsapp?: string | null;
          contact_social?: Json | null;
          special_restrictions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kennel_websites_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "Tenant";
            referencedColumns: ["id"];
          },
        ];
      };
      kennel_website_images: {
        Row: {
          id: string;
          kennel_website_id: string;
          image_url: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kennel_website_id: string;
          image_url: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kennel_website_id?: string;
          image_url?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kennel_website_images_kennel_website_id_fkey";
            columns: ["kennel_website_id"];
            isOneToOne: false;
            referencedRelation: "kennel_websites";
            referencedColumns: ["id"];
          },
        ];
      };
      kennel_website_videos: {
        Row: {
          id: string;
          kennel_website_id: string;
          video_url: string;
          title: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kennel_website_id: string;
          video_url: string;
          title?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kennel_website_id?: string;
          video_url?: string;
          title?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kennel_website_videos_kennel_website_id_fkey";
            columns: ["kennel_website_id"];
            isOneToOne: false;
            referencedRelation: "kennel_websites";
            referencedColumns: ["id"];
          },
        ];
      };
      kennel_website_testimonials: {
        Row: {
          id: string;
          kennel_website_id: string;
          customer_name: string;
          customer_photo_url: string | null;
          rating: number;
          testimonial_text: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kennel_website_id: string;
          customer_name: string;
          customer_photo_url?: string | null;
          rating: number;
          testimonial_text: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kennel_website_id?: string;
          customer_name?: string;
          customer_photo_url?: string | null;
          rating?: number;
          testimonial_text?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kennel_website_testimonials_kennel_website_id_fkey";
            columns: ["kennel_website_id"];
            isOneToOne: false;
            referencedRelation: "kennel_websites";
            referencedColumns: ["id"];
          },
        ];
      };
      kennel_website_faqs: {
        Row: {
          id: string;
          kennel_website_id: string;
          question: string;
          answer: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kennel_website_id: string;
          question: string;
          answer: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kennel_website_id?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kennel_website_faqs_kennel_website_id_fkey";
            columns: ["kennel_website_id"];
            isOneToOne: false;
            referencedRelation: "kennel_websites";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_tenant_and_link: {
        Args: {
          _user_id: string;
          _name: string;
        };
        Returns: string;
      };
      set_tenant: {
        Args: {
          _tenant_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      BookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED";
      PaymentMethod: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "BIT";
      PriceType: "DAILY" | "FIXED";
      TriggerType:
        | "BOOKING_CONFIRMATION"
        | "BOOKING_REMINDER"
        | "CHECK_IN_REMINDER"
        | "CHECK_OUT_REMINDER"
        | "PAYMENT_REMINDER"
        | "CUSTOM";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
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
} as const;
