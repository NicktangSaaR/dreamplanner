export interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements?: string[];
}

export interface Activity {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Award {
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface ResumeData {
  id?: string;
  request_id?: string;
  student_id?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin_url: string;
  personal_website: string;
  education: Education[];
  work_experience: WorkExperience[];
  activities: Activity[];
  awards: Award[];
  skills: string[];
  certifications: string[];
  projects: { name: string; description: string; technologies: string[]; url?: string }[];
  languages: { language: string; proficiency: string }[];
  generated_resume?: string;
}

export interface ResumeRequest {
  id: string;
  student_id: string;
  admin_id: string;
  status: 'pending' | 'submitted' | 'generated' | 'completed';
  due_date?: string;
  message?: string;
  created_at: string;
  updated_at: string;
  student?: {
    full_name: string;
    email: string;
  };
}
