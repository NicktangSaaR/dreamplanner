export interface CollegeApplication {
  id: string;
  college_name: string;
  major: string;
  degree: string;
  category: string;
  college_url: string;
  student_id: string;
}

export interface StudentProfile {
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
}