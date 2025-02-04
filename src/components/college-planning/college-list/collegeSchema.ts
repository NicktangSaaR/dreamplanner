
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
  college_url: z.string().optional(),
  avg_gpa: z.number().nullable().optional(),
  avg_sat: z.number().nullable().optional(),
  avg_act: z.number().nullable().optional(),
  gpa_75th: z.number().nullable().optional(),
  sat_75th: z.number().nullable().optional(),
  act_75th: z.number().nullable().optional(),
  institution_type: z.enum(["Public", "Private"]).nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  test_optional: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CollegeFormValues = z.infer<typeof formSchema>;
