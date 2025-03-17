
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useEvaluationForm } from "./hooks/useEvaluationForm";
import CommentsField from "./components/CommentsField";
import { ExportPDFButton } from "./components/ExportPDFButton";
import UniversityTypeSelector from "./components/UniversityTypeSelector";
import EvaluationCriteriaFields from "./components/EvaluationCriteriaFields";

interface EvaluationFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export default function EvaluationForm({ studentId, studentName, onSuccess }: EvaluationFormProps) {
  const { 
    form, 
    isSubmitting, 
    universityType, 
    setUniversityType,
    submittedEvaluation,
    handleSubmit 
  } = useEvaluationForm({
    studentId,
    studentName,
    onSuccess
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">US Undergraduate Admission Evaluation</CardTitle>
            <CardDescription>
              Create an evaluation for <span className="font-medium">{studentName}</span> (Scoring: 1 is highest, 6 is lowest)
            </CardDescription>
          </div>
          {submittedEvaluation && (
            <ExportPDFButton evaluation={submittedEvaluation} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <UniversityTypeSelector 
          value={universityType} 
          onChange={setUniversityType} 
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <EvaluationCriteriaFields 
              form={form} 
              universityType={universityType} 
            />

            {/* Comments Section */}
            <CommentsField form={form} />

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
