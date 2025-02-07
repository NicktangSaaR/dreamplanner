
export interface Profile {
  id: string;
  user_type: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  social_media: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  } | null;
  personal_website: string | null;
  graduation_school: string | null;
  background_intro: string | null;
  is_admin?: boolean;
  application_year: string | null;
  created_at?: string;
  updated_at?: string;
  career_interest_test?: {
    completedAt: string;
    scores: Record<string, number>;
    primaryType: string;
  } | null;
  email?: string | null;
}

export interface ProfileError {
  message: string;
  details?: any;
}

export interface ProfileFormData {
  full_name: string;
  grade: string | null;
  school: string | null;
  interested_majors: string;
  graduation_school: string | null;
  background_intro: string | null;
  social_media: {
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  personal_website: string;
}
