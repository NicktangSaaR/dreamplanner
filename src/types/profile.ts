export interface Profile {
  id: string;
  user_type: string;
  full_name: string | null;
  grade?: string;
  school?: string;
  interested_majors?: string[];
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  personal_website?: string;
  graduation_school?: string;
  background_intro?: string;
  is_admin?: boolean;
  application_year?: string;
}

export interface ProfileError {
  message: string;
  details?: any;
}