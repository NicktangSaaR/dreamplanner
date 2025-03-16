
export type ScoreValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface EvaluationCriteria {
  academics: ScoreValue;
  extracurriculars: ScoreValue;
  awards: ScoreValue;
  personalQualities: ScoreValue;
  essays: ScoreValue;
}

export interface StudentEvaluation {
  id: string;
  student_id: string;
  student_name: string;
  evaluation_date: string;
  academics_score: number;
  extracurriculars_score: number;
  awards_score: number;
  personal_qualities_score: number;
  essays_score: number;
  total_score: number;
  comments: string;
  admin_id: string;
  created_at?: string;
}
