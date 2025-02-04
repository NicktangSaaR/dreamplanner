
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
});

export type CollegeFormValues = z.infer<typeof formSchema>;
