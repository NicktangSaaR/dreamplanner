export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      article_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          id: string
          publish_date: string | null
          published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          publish_date?: string | null
          published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          publish_date?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sheets_config: {
        Row: {
          created_at: string | null
          form_url: string
          id: string
          sheet_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_url: string
          id?: string
          sheet_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_url?: string
          id?: string
          sheet_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      college_applications: {
        Row: {
          avg_act: number | null
          avg_gpa: number | null
          avg_sat: number | null
          category: string | null
          city: string | null
          college_name: string
          college_url: string
          country: string | null
          created_at: string | null
          degree: string
          gpa_75th: number | null
          gpa_scale_type: string | null
          id: string
          institution_type: string | null
          major: string
          max_act: number | null
          max_sat: number | null
          notes: string | null
          state: string | null
          student_id: string
          test_optional: boolean | null
          updated_at: string | null
        }
        Insert: {
          avg_act?: number | null
          avg_gpa?: number | null
          avg_sat?: number | null
          category?: string | null
          city?: string | null
          college_name: string
          college_url: string
          country?: string | null
          created_at?: string | null
          degree: string
          gpa_75th?: number | null
          gpa_scale_type?: string | null
          id?: string
          institution_type?: string | null
          major: string
          max_act?: number | null
          max_sat?: number | null
          notes?: string | null
          state?: string | null
          student_id: string
          test_optional?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avg_act?: number | null
          avg_gpa?: number | null
          avg_sat?: number | null
          category?: string | null
          city?: string | null
          college_name?: string
          college_url?: string
          country?: string | null
          created_at?: string | null
          degree?: string
          gpa_75th?: number | null
          gpa_scale_type?: string | null
          id?: string
          institution_type?: string | null
          major?: string
          max_act?: number | null
          max_sat?: number | null
          notes?: string | null
          state?: string | null
          student_id?: string
          test_optional?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      counselor_student_relationships: {
        Row: {
          added_by: string | null
          counselor_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          counselor_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          counselor_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counselor_student_relationships_counselor_profiles_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_student_relationships_student_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year: string | null
          course_type: string | null
          created_at: string | null
          gpa_value: number | null
          grade: string
          grade_level: string | null
          grade_type: string | null
          id: string
          name: string
          semester: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          course_type?: string | null
          created_at?: string | null
          gpa_value?: number | null
          grade: string
          grade_level?: string | null
          grade_type?: string | null
          id?: string
          name: string
          semester: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          course_type?: string | null
          created_at?: string | null
          gpa_value?: number | null
          grade?: string
          grade_level?: string | null
          grade_type?: string | null
          id?: string
          name?: string
          semester?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      extracurricular_activities: {
        Row: {
          created_at: string | null
          description: string | null
          grade_levels: string[] | null
          id: string
          name: string
          role: string
          student_id: string
          time_commitment: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade_levels?: string[] | null
          id?: string
          name: string
          role: string
          student_id: string
          time_commitment?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade_levels?: string[] | null
          id?: string
          name?: string
          role?: string
          student_id?: string
          time_commitment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      interview_practice_records: {
        Row: {
          created_at: string | null
          id: string
          practice_date: string | null
          question_id: string
          updated_at: string | null
          user_id: string
          video_url: string
          youtube_video_id: string | null
          youtube_video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          practice_date?: string | null
          question_id: string
          updated_at?: string | null
          user_id: string
          video_url: string
          youtube_video_id?: string | null
          youtube_video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          practice_date?: string | null
          question_id?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string
          youtube_video_id?: string | null
          youtube_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_practice_records_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_bank_questions: {
        Row: {
          bank_id: string
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bank_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bank_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_bank_questions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_questions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          preparation_time: number
          response_time: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          preparation_time?: number
          response_time?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          preparation_time?: number
          response_time?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string | null
          date: string | null
          id: string
          is_pinned: boolean | null
          stars: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          date?: string | null
          id?: string
          is_pinned?: boolean | null
          stars?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          date?: string | null
          id?: string
          is_pinned?: boolean | null
          stars?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          application_year: string | null
          background_intro: string | null
          career_interest_test: Json | null
          created_at: string
          full_name: string | null
          grade: string | null
          graduation_school: string | null
          id: string
          interested_majors: string[] | null
          is_admin: boolean | null
          personal_website: string | null
          school: string | null
          social_media: Json | null
          updated_at: string
          user_type: string
        }
        Insert: {
          application_year?: string | null
          background_intro?: string | null
          career_interest_test?: Json | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          graduation_school?: string | null
          id: string
          interested_majors?: string[] | null
          is_admin?: boolean | null
          personal_website?: string | null
          school?: string | null
          social_media?: Json | null
          updated_at?: string
          user_type: string
        }
        Update: {
          application_year?: string | null
          background_intro?: string | null
          career_interest_test?: Json | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          graduation_school?: string | null
          id?: string
          interested_majors?: string[] | null
          is_admin?: boolean | null
          personal_website?: string | null
          school?: string | null
          social_media?: Json | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      prospective_leads: {
        Row: {
          awards: string[] | null
          class_rank: string | null
          created_at: string | null
          current_courses: string[] | null
          extracurricular_activities: string[] | null
          gpa: number | null
          grade: string
          id: string
          interested_colleges: string[] | null
          interested_majors: string[] | null
          questions: string | null
          school: string
          student_name: string
          transcript_url: string | null
          updated_at: string | null
        }
        Insert: {
          awards?: string[] | null
          class_rank?: string | null
          created_at?: string | null
          current_courses?: string[] | null
          extracurricular_activities?: string[] | null
          gpa?: number | null
          grade: string
          id?: string
          interested_colleges?: string[] | null
          interested_majors?: string[] | null
          questions?: string | null
          school: string
          student_name: string
          transcript_url?: string | null
          updated_at?: string | null
        }
        Update: {
          awards?: string[] | null
          class_rank?: string | null
          created_at?: string | null
          current_courses?: string[] | null
          extracurricular_activities?: string[] | null
          gpa?: number | null
          grade?: string
          id?: string
          interested_colleges?: string[] | null
          interested_majors?: string[] | null
          questions?: string | null
          school?: string
          student_name?: string
          transcript_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shared_folders: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          folder_url: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_url: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_url?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_invitations: {
        Row: {
          accepted: boolean | null
          counselor_id: string
          created_at: string | null
          email: string
          id: string
          token: string
        }
        Insert: {
          accepted?: boolean | null
          counselor_id: string
          created_at?: string | null
          email: string
          id?: string
          token: string
        }
        Update: {
          accepted?: boolean | null
          counselor_id?: string
          created_at?: string | null
          email?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          author_id: string
          completed: boolean | null
          created_at: string | null
          due_date: string | null
          id: string
          starred: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          starred?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          starred?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      youtube_credentials: {
        Row: {
          access_token: string
          channel_id: string | null
          created_at: string | null
          id: string
          playlist_id: string | null
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          channel_id?: string | null
          created_at?: string | null
          id?: string
          playlist_id?: string | null
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string | null
          created_at?: string | null
          id?: string
          playlist_id?: string | null
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
