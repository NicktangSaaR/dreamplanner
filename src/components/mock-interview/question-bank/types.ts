import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  questions: z.string().min(1, "At least one question is required"),
  preparation_time: z.number().min(30, "Minimum preparation time is 30 seconds"),
  response_time: z.number().min(60, "Minimum response time is 60 seconds"),
});

export type FormData = z.infer<typeof formSchema>;

export interface Question {
  id: string;
  title: string;
  description?: string;
  preparation_time: number;
  response_time: number;
  created_by?: string;
  is_system?: boolean;
  mock_interview_bank_questions?: {
    id: string;
    title: string;
    description?: string;
  }[];
}