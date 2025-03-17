
// Reversed scoring: 1 is highest, 6 is lowest
export type ScoreValue = 1 | 2 | 3 | 4 | 5 | 6;

export type UniversityType = 'ivyLeague' | 'top30' | 'ucSystem';

export interface EvaluationCriteria {
  academics: ScoreValue;
  extracurriculars: ScoreValue;
  athletics: ScoreValue;
  personalQualities: ScoreValue;
  recommendations: ScoreValue;
  interview: ScoreValue;
  // New admission factors
  academicExcellence: ScoreValue;
  impactLeadership: ScoreValue;
  uniqueNarrative: ScoreValue;
}

export interface StudentEvaluation {
  id: string;
  student_id: string;
  student_name: string;
  evaluation_date: string;
  academics_score: number;
  extracurriculars_score: number;
  athletics_score: number;
  personal_qualities_score: number;
  recommendations_score: number;
  interview_score: number;
  // New admission factors scores
  academic_excellence_score?: number;
  impact_leadership_score?: number;
  unique_narrative_score?: number;
  total_score: number;
  comments: string;
  admin_id: string;
  university_type?: UniversityType;
  created_at?: string;
}

export interface CriteriaDescription {
  [key: number]: string;
}

export interface CriteriaDescriptions {
  [key: string]: CriteriaDescription;
}
