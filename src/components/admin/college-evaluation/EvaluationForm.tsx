
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
            <CardTitle className="text-2xl font-bold">美国本科录取评估表</CardTitle>
            <CardDescription>
              为 <span className="font-medium">{studentName}</span> 创建评估（评分标准：1为最高，6为最低）
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
                {isSubmitting ? "提交中..." : "提交评估"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
