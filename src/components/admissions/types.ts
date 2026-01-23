export interface AdmissionCase {
  id: number;
  year: string;
  country: string;
  university: string;
  major?: string;
  offer_image?: string;
  profile_style: string;
  academic_background: string;
  activities: string[];
  courses: string[];
  created_at?: string;
  updated_at?: string;
}

export interface NewCaseForm {
  year: string;
  country: string;
  university: string;
  major: string;
  offer_image: string;
  profile_style: string;
  academic_background: string;
  activities: string[];
  courses: string[];
}

export const initialCaseForm: NewCaseForm = {
  year: '',
  country: '',
  university: '',
  major: '',
  offer_image: '',
  profile_style: '',
  academic_background: '',
  activities: [''],
  courses: ['']
};
