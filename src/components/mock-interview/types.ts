export interface Question {
  id: string;
  title: string;
  description: string | null;
  preparation_time: number;
  response_time: number;
  is_system: boolean;
  mock_interview_bank_questions?: {
    id: string;
    title: string;
    description: string | null;
  }[];
}

export interface InterviewSettings {
  prepTime: number;
  responseTime: number;
  selectedQuestionId: string | null;
  practiceMode: 'single' | 'multiple';
  questionOrder: 'sequential' | 'random';
  numberOfQuestions: number;
}