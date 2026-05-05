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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_details: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch: string | null
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      bundle_classes: {
        Row: {
          bundle_id: string
          class_id: string
          id: string
        }
        Insert: {
          bundle_id: string
          class_id: string
          id?: string
        }
        Update: {
          bundle_id?: string
          class_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_classes_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          original_price: number | null
          price: number
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          original_price?: number | null
          price: number
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          original_price?: number | null
          price?: number
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          class_id: string | null
          id: string
          issued_at: string
          pdf_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          class_id?: string | null
          id?: string
          issued_at?: string
          pdf_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          class_id?: string | null
          id?: string
          issued_at?: string
          pdf_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_lessons: {
        Row: {
          class_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          lesson_number: number | null
          title: string
          video_url: string
        }
        Insert: {
          class_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          lesson_number?: number | null
          title: string
          video_url: string
        }
        Update: {
          class_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          lesson_number?: number | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_materials: {
        Row: {
          class_id: string
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_requests: {
        Row: {
          admin_notes: string | null
          admin_reply: string | null
          assigned_teacher_id: string | null
          budget: number | null
          class_type: string
          created_at: string
          currency: string
          curriculum_id: string | null
          email: string
          grade_id: string | null
          grade_text: string | null
          id: string
          message: string | null
          phone: string | null
          preferred_date: string | null
          preferred_language: string | null
          preferred_time: string | null
          proposed_price: number | null
          replied_at: string | null
          status: string
          student_name: string
          subject_id: string | null
          subject_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_reply?: string | null
          assigned_teacher_id?: string | null
          budget?: number | null
          class_type?: string
          created_at?: string
          currency?: string
          curriculum_id?: string | null
          email: string
          grade_id?: string | null
          grade_text?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          proposed_price?: number | null
          replied_at?: string | null
          status?: string
          student_name: string
          subject_id?: string | null
          subject_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_reply?: string | null
          assigned_teacher_id?: string | null
          budget?: number | null
          class_type?: string
          created_at?: string
          currency?: string
          curriculum_id?: string | null
          email?: string
          grade_id?: string | null
          grade_text?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          proposed_price?: number | null
          replied_at?: string | null
          status?: string
          student_name?: string
          subject_id?: string | null
          subject_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      class_sessions: {
        Row: {
          class_id: string
          created_at: string
          end_time: string
          id: string
          notes_url: string | null
          recording_url: string | null
          session_date: string
          start_time: string
          status: string
          title: string
          week_number: number | null
          zoom_link: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time: string
          id?: string
          notes_url?: string | null
          recording_url?: string | null
          session_date: string
          start_time: string
          status?: string
          title: string
          week_number?: number | null
          zoom_link?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes_url?: string | null
          recording_url?: string | null
          session_date?: string
          start_time?: string
          status?: string
          title?: string
          week_number?: number | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          access_duration_days: number | null
          approval_status: string
          class_type: string
          created_at: string
          currency: string
          curriculum_id: string | null
          delivery_mode: string
          description: string | null
          duration_minutes: number | null
          free_trial_duration_minutes: number | null
          grade_id: string | null
          has_free_trial: boolean | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_live: boolean
          max_students: number | null
          original_price: number | null
          price: number
          schedule_day: string | null
          schedule_time: string | null
          short_description: string | null
          subject_id: string | null
          teacher_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_duration_days?: number | null
          approval_status?: string
          class_type?: string
          created_at?: string
          currency?: string
          curriculum_id?: string | null
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number | null
          free_trial_duration_minutes?: number | null
          grade_id?: string | null
          has_free_trial?: boolean | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_live?: boolean
          max_students?: number | null
          original_price?: number | null
          price?: number
          schedule_day?: string | null
          schedule_time?: string | null
          short_description?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_duration_days?: number | null
          approval_status?: string
          class_type?: string
          created_at?: string
          currency?: string
          curriculum_id?: string | null
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number | null
          free_trial_duration_minutes?: number | null
          grade_id?: string | null
          has_free_trial?: boolean | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_live?: boolean
          max_students?: number | null
          original_price?: number | null
          price?: number
          schedule_day?: string | null
          schedule_time?: string | null
          short_description?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      curriculums: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          bundle_id: string | null
          class_id: string | null
          enrolled_at: string
          expires_at: string | null
          id: string
          recording_id: string | null
          session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          bundle_id?: string | null
          class_id?: string | null
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          recording_id?: string | null
          session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          bundle_id?: string | null
          class_id?: string | null
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          recording_id?: string | null
          session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          curriculum_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_documents: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          module_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          module_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lesson_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_modules: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          recording_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          recording_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          recording_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          module_id: string
          sort_order: number
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lesson_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          enrollment_id: string | null
          id: string
          items: Json | null
          payment_method: string | null
          payment_status: string
          receipt_url: string | null
          transaction_ref: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          enrollment_id?: string | null
          id?: string
          items?: Json | null
          payment_method?: string | null
          payment_status?: string
          receipt_url?: string | null
          transaction_ref?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          enrollment_id?: string | null
          id?: string
          items?: Json | null
          payment_method?: string | null
          payment_status?: string
          receipt_url?: string | null
          transaction_ref?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          admission_number: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_banned: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_number?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_number?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recording_notes: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          recording_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          recording_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          recording_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_notes_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_videos: {
        Row: {
          chapter_name: string | null
          created_at: string
          duration_minutes: number | null
          episode_number: number | null
          id: string
          is_active: boolean
          recording_id: string
          session_date: string | null
          title: string
          video_url: string
        }
        Insert: {
          chapter_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          episode_number?: number | null
          id?: string
          is_active?: boolean
          recording_id: string
          session_date?: string | null
          title: string
          video_url: string
        }
        Update: {
          chapter_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          episode_number?: number | null
          id?: string
          is_active?: boolean
          recording_id?: string
          session_date?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_videos_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          access_duration_days: number | null
          class_id: string | null
          created_at: string
          curriculum_id: string | null
          description: string | null
          duration_minutes: number | null
          free_preview_url: string | null
          grade_id: string | null
          id: string
          is_active: boolean
          notes_url: string | null
          price: number
          recording_type: string | null
          subject_id: string | null
          teacher_id: string | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          access_duration_days?: number | null
          class_id?: string | null
          created_at?: string
          curriculum_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          free_preview_url?: string | null
          grade_id?: string | null
          id?: string
          is_active?: boolean
          notes_url?: string | null
          price?: number
          recording_type?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          access_duration_days?: number | null
          class_id?: string | null
          created_at?: string
          curriculum_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          free_preview_url?: string | null
          grade_id?: string | null
          id?: string
          is_active?: boolean
          notes_url?: string | null
          price?: number
          recording_type?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          class_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          class_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          class_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_resources: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          session_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          session_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_resources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          resource_id: string | null
          resource_title: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_title?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          qualifications: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          qualifications?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          qualifications?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tutor_applications: {
        Row: {
          address: string | null
          age: number | null
          agreed_payment_terms: boolean
          agreed_platform_fee: boolean
          created_at: string
          curriculum_london: boolean | null
          curriculum_national: boolean | null
          cv_url: string | null
          demo_recording_url: string | null
          email: string
          id: string
          max_grade_level: string | null
          name: string
          online_teaching_years: number | null
          phone: string
          status: string
          subjects_can_teach: string | null
          teaching_experience: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          agreed_payment_terms?: boolean
          agreed_platform_fee?: boolean
          created_at?: string
          curriculum_london?: boolean | null
          curriculum_national?: boolean | null
          cv_url?: string | null
          demo_recording_url?: string | null
          email: string
          id?: string
          max_grade_level?: string | null
          name: string
          online_teaching_years?: number | null
          phone: string
          status?: string
          subjects_can_teach?: string | null
          teaching_experience?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          agreed_payment_terms?: boolean
          agreed_platform_fee?: boolean
          created_at?: string
          curriculum_london?: boolean | null
          curriculum_national?: boolean | null
          cv_url?: string | null
          demo_recording_url?: string | null
          email?: string
          id?: string
          max_grade_level?: string | null
          name?: string
          online_teaching_years?: number | null
          phone?: string
          status?: string
          subjects_can_teach?: string | null
          teaching_experience?: string | null
          user_id?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlists: {
        Row: {
          class_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_automation_logs: {
        Row: {
          api_response: Json | null
          class_id: string | null
          course_id: string | null
          created_at: string
          enrollment_id: string | null
          error: string | null
          id: string
          message_body: string | null
          message_type: string
          phone: string | null
          provider: string | null
          reminder_stage: string | null
          sent_at: string | null
          session_id: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          api_response?: Json | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          error?: string | null
          id?: string
          message_body?: string | null
          message_type: string
          phone?: string | null
          provider?: string | null
          reminder_stage?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          api_response?: Json | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          error?: string | null
          id?: string
          message_body?: string | null
          message_type?: string
          phone?: string | null
          provider?: string | null
          reminder_stage?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: []
      }
      whatsapp_automation_settings: {
        Row: {
          class_reminders_enabled: boolean
          class_stages: Json
          created_at: string
          default_reminder_time: string | null
          expiry_reminders_enabled: boolean
          expiry_stages: Json
          id: string
          last_class_run_at: string | null
          last_expiry_run_at: string | null
          login_alerts_enabled: boolean
          updated_at: string
        }
        Insert: {
          class_reminders_enabled?: boolean
          class_stages?: Json
          created_at?: string
          default_reminder_time?: string | null
          expiry_reminders_enabled?: boolean
          expiry_stages?: Json
          id?: string
          last_class_run_at?: string | null
          last_expiry_run_at?: string | null
          login_alerts_enabled?: boolean
          updated_at?: string
        }
        Update: {
          class_reminders_enabled?: boolean
          class_stages?: Json
          created_at?: string
          default_reminder_time?: string | null
          expiry_reminders_enabled?: boolean
          expiry_stages?: Json
          id?: string
          last_class_run_at?: string | null
          last_expiry_run_at?: string | null
          login_alerts_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          context: Json | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          phone: string
          sent_at: string | null
          status: string
          template_id: string | null
          type: string
          updated_at: string
          user_id: string | null
          wa_link: string | null
        }
        Insert: {
          body: string
          context?: Json | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          phone: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          wa_link?: string | null
        }
        Update: {
          body?: string
          context?: Json | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          phone?: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          wa_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          admin_phone: string | null
          created_at: string
          enabled_types: Json
          id: string
          login_link: string | null
          payment_instructions: string | null
          provider: string
          provider_config: Json | null
          reminder_days_before: number
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          admin_phone?: string | null
          created_at?: string
          enabled_types?: Json
          id?: string
          login_link?: string | null
          payment_instructions?: string | null
          provider?: string
          provider_config?: Json | null
          reminder_days_before?: number
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          admin_phone?: string | null
          created_at?: string
          enabled_types?: Json
          id?: string
          login_link?: string | null
          payment_instructions?: string | null
          provider?: string
          provider_config?: Json | null
          reminder_days_before?: number
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          class_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_admission_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "student" | "tutor"
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
      app_role: ["admin", "moderator", "student", "tutor"],
    },
  },
} as const
