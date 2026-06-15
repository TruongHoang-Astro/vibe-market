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
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total: number;
          status?: OrderStatus;
          address: string;
          payment_method: string;
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
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          qty: number;
          price: number;
          image?: string | null;
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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
}
