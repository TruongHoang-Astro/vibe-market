// lib/supabase/types.ts
// Kiểu dữ liệu cho Supabase Database, khớp với supabase/schema.sql.
// Khi schema thay đổi, có thể tự sinh lại bằng:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'delivered'
  | 'cancelled';
export type ProductBadge = 'new' | 'sale' | 'hot' | 'bestseller';
export type UserRole = 'buyer' | 'seller' | 'admin';
export type MessageType = 'text' | 'image' | 'audio' | 'video';
export type MessageSender = 'buyer' | 'shop';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          count: number;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          color: string;
          count?: number;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          logo: string;
          banner: string;
          rating: number;
          followers: number;
          products: number;
          response_rate: number;
          response_time: string;
          joined_date: string;
          description: string;
          category: string;
          verified: boolean;
          theme_color: string;
          announcement: string;
          return_policy: string;
          shipping_policy: string;
          warranty_policy: string;
          created_at: string;
        };
        Insert: {
          id: string;
          owner_id?: string | null;
          name: string;
          logo: string;
          banner: string;
          rating?: number;
          followers?: number;
          products?: number;
          response_rate?: number;
          response_time?: string;
          joined_date?: string;
          description?: string;
          category: string;
          verified?: boolean;
          theme_color?: string;
          announcement?: string;
          return_policy?: string;
          shipping_policy?: string;
          warranty_policy?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shops']['Insert']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          price: number;
          original_price: number;
          image: string;
          images: string[];
          category: string;
          subcategory: string | null;
          rating: number;
          reviews: number;
          sold: number;
          stock: number;
          description: string;
          badge: ProductBadge | null;
          colors: string[] | null;
          sizes: string[] | null;
          is_flash_sale: boolean;
          flash_sale_price: number | null;
          size_guide: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          shop_id: string;
          name: string;
          price: number;
          original_price: number;
          image: string;
          images?: string[];
          category: string;
          subcategory?: string | null;
          rating?: number;
          reviews?: number;
          sold?: number;
          stock?: number;
          description?: string;
          badge?: ProductBadge | null;
          colors?: string[] | null;
          sizes?: string[] | null;
          is_flash_sale?: boolean;
          flash_sale_price?: number | null;
          size_guide?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          user_name: string;
          avatar: string | null;
          rating: number;
          comment: string;
          images: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          user_name: string;
          avatar?: string | null;
          rating: number;
          comment: string;
          images?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          total: number;
          status: OrderStatus;
          address: string;
          payment_method: string;
          shipping_method: string;
          shipping_fee: number;
          payment_provider: string;
          payment_status: string;
          paid_at: string | null;
          payment_ref: string | null;
          voucher_code: string | null;
          discount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total: number;
          status?: OrderStatus;
          address: string;
          payment_method: string;
          shipping_method?: string;
          shipping_fee?: number;
          payment_provider?: string;
          payment_status?: string;
          paid_at?: string | null;
          payment_ref?: string | null;
          voucher_code?: string | null;
          discount?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          qty: number;
          price: number;
          image: string | null;
          variant_id: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          qty: number;
          price: number;
          image?: string | null;
          variant_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          buyer_id: string;
          shop_id: string;
          last_message: string | null;
          last_time: string;
          unread_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          shop_id: string;
          last_message?: string | null;
          last_time?: string;
          unread_count?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: MessageSender;
          type: MessageType;
          content: string;
          file_name: string | null;
          duration: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender: MessageSender;
          type?: MessageType;
          content: string;
          file_name?: string | null;
          duration?: number | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient: string;
          phone: string;
          address: string;
          ward: string | null;
          district: string | null;
          province: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient: string;
          phone: string;
          address: string;
          ward?: string | null;
          district?: string | null;
          province: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          target_type: string;
          target_id: string;
          target_label: string;
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          target_type: string;
          target_id: string;
          target_label?: string;
          reason?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: [];
      };
      shop_follows: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shop_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shop_follows']['Insert']>;
        Relationships: [];
      };
      return_requests: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          reason: string;
          detail: string;
          images: string[] | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          reason: string;
          detail?: string;
          images?: string[] | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['return_requests']['Insert']>;
        Relationships: [];
      };
      vouchers: {
        Row: {
          id: string;
          code: string;
          description: string;
          discount_type: string;
          discount_value: number;
          max_discount: number | null;
          min_order: number;
          shop_id: string | null;
          usage_limit: number | null;
          used_count: number;
          starts_at: string | null;
          expires_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string;
          discount_type?: string;
          discount_value?: number;
          max_discount?: number | null;
          min_order?: number;
          shop_id?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vouchers']['Insert']>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          stock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price?: number;
          stock?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
}
