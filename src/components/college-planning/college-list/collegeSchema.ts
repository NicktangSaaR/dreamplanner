
import * as z from "zod";

export const formSchema = z.object({
  college_name: z.string().min(1, "College name is required"),
  major: z.string().min(1, "Major is required"),
  degree: z.enum(["Bachelor", "Master"], {
    required_error: "Please select a degree type",
  }),
  category: z.enum(["Hard Reach", "Reach", "Hard Target", "Target", "Safety"], {
    required_error: "Please select a category",
  }),
  avg_gpa: z.number().min(0).max(5).optional(),
  avg_sat: z.number().min(0).max(1600).optional(),
  avg_act: z.number().min(0).max(36).optional(),
  institution_type: z.enum(["Public", "Private"]).optional(),
  state: z.string().optional(),
});

export type CollegeFormValues = z.infer<typeof formSchema>;
