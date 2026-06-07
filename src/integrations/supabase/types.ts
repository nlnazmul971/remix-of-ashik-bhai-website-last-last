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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: Json | null
          reason: string | null
          requested_by: string | null
          requester_email: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: Json | null
          reason?: string | null
          requested_by?: string | null
          requester_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: Json | null
          reason?: string | null
          requested_by?: string | null
          requester_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          slug: string
          social: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          social?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          social?: Json
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          blog_id: string
          comment: string
          created_at: string
          email: string | null
          id: string
          is_approved: boolean
          name: string
        }
        Insert: {
          blog_id: string
          comment: string
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
          name: string
        }
        Update: {
          blog_id?: string
          comment?: string
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
          name?: string
        }
        Relationships: []
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          faq: Json
          id: string
          published_at: string | null
          reading_time: number
          related_post_ids: string[]
          seo_canonical: string | null
          seo_description: string | null
          seo_focus_keyword: string | null
          seo_keywords: string | null
          seo_no_index: boolean
          seo_og_image: string | null
          seo_schema: Json | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json
          id?: string
          published_at?: string | null
          reading_time?: number
          related_post_ids?: string[]
          seo_canonical?: string | null
          seo_description?: string | null
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json
          id?: string
          published_at?: string | null
          reading_time?: number
          related_post_ids?: string[]
          seo_canonical?: string | null
          seo_description?: string | null
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      checkout_payment_settings: {
        Row: {
          created_at: string
          id: string
          instructions: string
          is_active: boolean
          number: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          number?: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          number?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number
          name: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          name?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          name?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          banner_url: string
          created_at: string
          id: string
          is_active: boolean
          product_ids: string[]
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_ids?: string[]
          slug: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_ids?: string[]
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          description: string | null
          fee: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fraud_checks: {
        Row: {
          cancel_parcel: number
          checked_at: string
          created_at: string
          id: string
          phone: string
          response: Json
          score: number
          source: string
          status: string
          success_parcel: number
          total_parcel: number
          updated_at: string
        }
        Insert: {
          cancel_parcel?: number
          checked_at?: string
          created_at?: string
          id?: string
          phone: string
          response?: Json
          score?: number
          source?: string
          status?: string
          success_parcel?: number
          total_parcel?: number
          updated_at?: string
        }
        Update: {
          cancel_parcel?: number
          checked_at?: string
          created_at?: string
          id?: string
          phone?: string
          response?: Json
          score?: number
          source?: string
          status?: string
          success_parcel?: number
          total_parcel?: number
          updated_at?: string
        }
        Relationships: []
      }
      header_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          landing_page_id: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          landing_page_id: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          landing_page_id?: string
          metadata?: Json
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          blocks: Json
          conversion_count: number
          created_at: string
          description: string | null
          id: string
          published_at: string | null
          seo_canonical: string | null
          seo_description: string | null
          seo_focus_keyword: string | null
          seo_keywords: string | null
          seo_no_index: boolean
          seo_og_image: string | null
          seo_schema: Json | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          blocks?: Json
          conversion_count?: number
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          seo_canonical?: string | null
          seo_description?: string | null
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          blocks?: Json
          conversion_count?: number
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          seo_canonical?: string | null
          seo_description?: string | null
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          advance_payment: number
          call_attempts: number
          consignment_id: string | null
          courier_fee: number
          courier_provider: string | null
          created_at: string
          customer_address: string
          customer_city: string
          customer_email: string | null
          customer_name: string
          customer_note: string | null
          customer_phone: string
          deleted_at: string | null
          delivery_charge: number
          delivery_method: string
          discount: number
          id: string
          items: Json
          order_token: string | null
          payment_method: string
          payment_sender_number: string | null
          return_received: boolean
          source: string
          status: string
          total: number
          tracking_code: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          advance_payment?: number
          call_attempts?: number
          consignment_id?: string | null
          courier_fee?: number
          courier_provider?: string | null
          created_at?: string
          customer_address: string
          customer_city: string
          customer_email?: string | null
          customer_name: string
          customer_note?: string | null
          customer_phone: string
          deleted_at?: string | null
          delivery_charge?: number
          delivery_method?: string
          discount?: number
          id?: string
          items: Json
          order_token?: string | null
          payment_method?: string
          payment_sender_number?: string | null
          return_received?: boolean
          source?: string
          status?: string
          total: number
          tracking_code?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          advance_payment?: number
          call_attempts?: number
          consignment_id?: string | null
          courier_fee?: number
          courier_provider?: string | null
          created_at?: string
          customer_address?: string
          customer_city?: string
          customer_email?: string | null
          customer_name?: string
          customer_note?: string | null
          customer_phone?: string
          deleted_at?: string | null
          delivery_charge?: number
          delivery_method?: string
          discount?: number
          id?: string
          items?: Json
          order_token?: string | null
          payment_method?: string
          payment_sender_number?: string | null
          return_received?: boolean
          source?: string
          status?: string
          total?: number
          tracking_code?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      packaging_options: {
        Row: {
          created_at: string
          description: string | null
          fee: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_size_stock: {
        Row: {
          cancelled_count: number
          created_at: string
          id: string
          product_id: string
          returned_count: number
          size: string
          sold_count: number
          total_stock: number
          updated_at: string
        }
        Insert: {
          cancelled_count?: number
          created_at?: string
          id?: string
          product_id: string
          returned_count?: number
          size: string
          sold_count?: number
          total_stock?: number
          updated_at?: string
        }
        Update: {
          cancelled_count?: number
          created_at?: string
          id?: string
          product_id?: string
          returned_count?: number
          size?: string
          sold_count?: number
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_size_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          category: string
          colors: Json
          created_at: string
          description: string
          featured: boolean
          homepage_placements: string[]
          id: string
          image_url: string
          is_active: boolean
          is_new_arrival: boolean
          is_new_drop: boolean
          is_trending: boolean
          name: string
          original_price: number | null
          price: number
          seo_canonical: string | null
          seo_description: string | null
          seo_faq: Json
          seo_focus_keyword: string | null
          seo_keywords: string | null
          seo_no_index: boolean
          seo_og_image: string | null
          seo_schema: Json | null
          seo_slug: string | null
          seo_title: string | null
          size_chart: Json | null
          sizes: string[]
          sku: string
          stock: number
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          brand?: string
          category: string
          colors?: Json
          created_at?: string
          description?: string
          featured?: boolean
          homepage_placements?: string[]
          id?: string
          image_url?: string
          is_active?: boolean
          is_new_arrival?: boolean
          is_new_drop?: boolean
          is_trending?: boolean
          name: string
          original_price?: number | null
          price: number
          seo_canonical?: string | null
          seo_description?: string | null
          seo_faq?: Json
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_slug?: string | null
          seo_title?: string | null
          size_chart?: Json | null
          sizes?: string[]
          sku?: string
          stock?: number
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          colors?: Json
          created_at?: string
          description?: string
          featured?: boolean
          homepage_placements?: string[]
          id?: string
          image_url?: string
          is_active?: boolean
          is_new_arrival?: boolean
          is_new_drop?: boolean
          is_trending?: boolean
          name?: string
          original_price?: number | null
          price?: number
          seo_canonical?: string | null
          seo_description?: string | null
          seo_faq?: Json
          seo_focus_keyword?: string | null
          seo_keywords?: string | null
          seo_no_index?: boolean
          seo_og_image?: string | null
          seo_schema?: Json | null
          seo_slug?: string | null
          seo_title?: string | null
          size_chart?: Json | null
          sizes?: string[]
          sku?: string
          stock?: number
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pseo_pages: {
        Row: {
          content: string
          created_at: string
          description: string
          h1: string
          id: string
          seo_keywords: string | null
          seo_og_image: string | null
          seo_schema: Json | null
          slug: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
          variables: Json
          view_count: number
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          h1?: string
          id?: string
          seo_keywords?: string | null
          seo_og_image?: string | null
          seo_schema?: Json | null
          slug: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          variables?: Json
          view_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          h1?: string
          id?: string
          seo_keywords?: string | null
          seo_og_image?: string | null
          seo_schema?: Json | null
          slug?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          variables?: Json
          view_count?: number
        }
        Relationships: []
      }
      pseo_templates: {
        Row: {
          content_template: string
          created_at: string
          description_template: string
          h1_template: string
          id: string
          is_active: boolean
          name: string
          schema_template: Json | null
          seo_keywords_template: string | null
          title_template: string
          updated_at: string
          url_pattern: string
          variables: Json
        }
        Insert: {
          content_template?: string
          created_at?: string
          description_template?: string
          h1_template?: string
          id?: string
          is_active?: boolean
          name: string
          schema_template?: Json | null
          seo_keywords_template?: string | null
          title_template?: string
          updated_at?: string
          url_pattern: string
          variables?: Json
        }
        Update: {
          content_template?: string
          created_at?: string
          description_template?: string
          h1_template?: string
          id?: string
          is_active?: boolean
          name?: string
          schema_template?: Json | null
          seo_keywords_template?: string | null
          title_template?: string
          updated_at?: string
          url_pattern?: string
          variables?: Json
        }
        Relationships: []
      }
      redirects: {
        Row: {
          created_at: string
          from_path: string
          hit_count: number
          id: string
          is_active: boolean
          last_hit_at: string | null
          notes: string | null
          status_code: number
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_path: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          notes?: string | null
          status_code?: number
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_path?: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          notes?: string | null
          status_code?: number
          to_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          name: string
          product_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          name: string
          product_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_logs: {
        Row: {
          change_type: string
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          product_id: string
          quantity: number
          size: string
        }
        Insert: {
          change_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id: string
          quantity?: number
          size: string
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string
          quantity?: number
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_category: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_category: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_category?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tracking_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      trash_users: {
        Row: {
          address: string | null
          city: string | null
          deleted_at: string
          display_name: string | null
          email: string | null
          id: string
          original_user_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          deleted_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          original_user_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          deleted_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          original_user_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: { _order: Json }
        Returns: {
          admin_notes: string | null
          advance_payment: number
          call_attempts: number
          consignment_id: string | null
          courier_fee: number
          courier_provider: string | null
          created_at: string
          customer_address: string
          customer_city: string
          customer_email: string | null
          customer_name: string
          customer_note: string | null
          customer_phone: string
          deleted_at: string | null
          delivery_charge: number
          delivery_method: string
          discount: number
          id: string
          items: Json
          order_token: string | null
          payment_method: string
          payment_sender_number: string | null
          return_received: boolean
          source: string
          status: string
          total: number
          tracking_code: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
