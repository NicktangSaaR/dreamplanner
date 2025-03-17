
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StudentEvaluation, UniversityType } from "../types";
import { useState } from "react";
import { UniversityTypeTabs } from "./UniversityTypeTabs";
import { EvaluationSection } from "./EvaluationSection";
import { groupEvaluationsByType, getUniqueUniversityTypes } from "../utils/evaluationGroupingUtils";

interface EvaluationsTableProps {
  evaluations: StudentEvaluation[] | null | undefined;
  isLoading: boolean;
}

export default function EvaluationsTable({ evaluations, isLoading }: EvaluationsTableProps) {
  // Add state to track active university type tab
  const [activeTab, setActiveTab] = useState<UniversityType | 'all'>('all');

  const groupedEvaluations = groupEvaluationsByType(evaluations);
  
  // Get all university types present in evaluations
  const universityTypes = getUniqueUniversityTypes(evaluations);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Created Evaluations</CardTitle>
        <CardDescription>
          View all completed student evaluations (Scoring criteria: 1 is highest, 6 is lowest)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading evaluation data...</div>
        ) : evaluations && evaluations.length > 0 ? (
          <div className="space-y-6">
            <UniversityTypeTabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              universityTypes={universityTypes} 
            />
            
            {activeTab === 'all' ? (
              // Render sections for each university type
              Object.entries(groupedEvaluations).map(([type, evals]) => (
                <EvaluationSection key={type} type={type} evaluations={evals} />
              ))
            ) : (
              // Render only the active tab's evaluations
              groupedEvaluations[activeTab] && (
                <EvaluationSection type={activeTab} evaluations={groupedEvaluations[activeTab]} />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-4">No evaluation data available</div>
        )}
      </CardContent>
    </Card>
  );
}
