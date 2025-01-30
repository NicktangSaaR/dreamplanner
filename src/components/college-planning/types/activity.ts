export interface Activity {
  id: string;
  name: string;
  role: string;
  description?: string;
  time_commitment?: string;
  grade_levels?: string[];
}