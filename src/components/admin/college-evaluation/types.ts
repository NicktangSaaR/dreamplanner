
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
  studentId: string;
  studentName: string;
  evaluationDate: string;
  criteria: EvaluationCriteria;
  comments: string;
  totalScore: number;
  adminId: string;
}
