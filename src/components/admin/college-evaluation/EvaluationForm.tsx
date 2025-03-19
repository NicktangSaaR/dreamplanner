import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useEvaluationForm } from "./hooks/useEvaluationForm";
import CommentsField from "./components/CommentsField";
import { ExportPDFButton } from "./components/ExportPDFButton";
import UniversityTypeSelector from "./components/UniversityTypeSelector";
import EvaluationCriteriaFields from "./components/EvaluationCriteriaFields";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { StudentEvaluation } from "./types";
interface EvaluationFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  existingEvaluation?: StudentEvaluation;
  isEditing?: boolean;
}
export default function EvaluationForm({
  studentId,
  studentName,
  onSuccess,
  onError,
  existingEvaluation,
  isEditing = false
}: EvaluationFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    existingEvaluation,
    isEditing,
    onSuccess,
    onError: message => {
      setErrorMessage(message);
      if (onError) onError(message);
    }
  });

  // Clear error when changing university type
  useEffect(() => {
    setErrorMessage(null);
  }, [universityType]);

  // Handle form submission with error catching
  const onSubmit = async (values: any) => {
    setErrorMessage(null);
    try {
      await handleSubmit(values);
    } catch (error) {
      console.error("Error in form submission:", error);
      const message = "Failed to " + (isEditing ? "update" : "create") + " evaluation. Please try again later.";
      setErrorMessage(message);
      if (onError) {
        onError(message);
      }
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">US Undergraduate Admission Evaluation</CardTitle>
            <CardDescription>
              {isEditing ? "Update" : "Create"} an evaluation for <span className="font-medium">{studentName}</span> (Scoring: 1 is highest, 6 is lowest)
            </CardDescription>
          </div>
          {submittedEvaluation && <ExportPDFButton evaluation={submittedEvaluation} />}
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>}
        
        <UniversityTypeSelector value={universityType} onChange={setUniversityType} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh]">
              <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
                {/* Core Criteria Section - Left Panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="p-4 h-full">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">DreamPlanner's 3 Cores</h3>
                      <p className="text-sm text-gray-500 mb-3">These three factors are critical for Ivy League admissions</p>
                      
                      <div className="space-y-4">
                        <EvaluationCriteriaFields form={form} universityType={universityType} criteriaType="core" />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
                
                {/* Resizable Handle */}
                <ResizableHandle withHandle />
                
                {/* Traditional Criteria Section - Right Panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="p-4 h-full">
                    <div className="mb-2">
                      <h3 className="text-lg font-semibold mb-2">Traditional Evaluation Criteria</h3>
                      <p className="text-sm text-gray-500 mb-3">Traditional evaluation criteria</p>
                      
                      <div className="space-y-4">
                        <EvaluationCriteriaFields form={form} universityType={universityType} criteriaType="traditional" />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
              
              {/* Comments Section */}
              <div className="p-4">
                <CommentsField form={form} />
              </div>
            </ScrollArea>

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : isEditing ? "Update Evaluation" : "Submit Evaluation"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}