
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation, UniversityType } from "../types";
import { exportEvaluationToPDF, getUniversityTypeDisplay } from "../utils/pdfExportUtils";
import { useState } from "react";

interface EvaluationsTableProps {
  evaluations: StudentEvaluation[] | null | undefined;
  isLoading: boolean;
}

export default function EvaluationsTable({ evaluations, isLoading }: EvaluationsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  // Add state to track active university type tab
  const [activeTab, setActiveTab] = useState<UniversityType | 'all'>('all');

  const handleExportPDF = (evaluation: StudentEvaluation) => {
    // Add default university type if not present
    const evaluationWithType = {
      ...evaluation,
      university_type: evaluation.university_type || 'ivyLeague'
    };
    exportEvaluationToPDF(evaluationWithType);
  };

  // Group evaluations by university type
  const groupEvaluationsByType = (evals: StudentEvaluation[] | null | undefined) => {
    if (!evals) return {};
    
    return evals.reduce<Record<string, StudentEvaluation[]>>((groups, evaluation) => {
      const type = evaluation.university_type || 'ivyLeague';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(evaluation);
      return groups;
    }, {});
  };

  const groupedEvaluations = groupEvaluationsByType(evaluations);
  
  // Get all university types present in evaluations
  const universityTypes = evaluations 
    ? Array.from(new Set(evaluations.map(e => e.university_type || 'ivyLeague')))
    : [];

  // Function to get appropriate column label based on university type
  const getColumnLabel = (key: string, universityType?: UniversityType): string => {
    if (universityType === 'ucSystem') {
      switch (key) {
        case 'recommendations':
          return "PIQs";
        case 'athletics':
          return "Personal Talents";
        case 'interview':
          return "N/A";
        default:
          break;
      }
    }
    
    switch (key) {
      case 'academics':
        return "Academics";
      case 'extracurriculars':
        return "Extracurriculars";
      case 'athletics':
        return "Athletics";
      case 'personalQualities':
        return "Personal Qualities";
      case 'recommendations':
        return "Recommendations";
      case 'interview':
        return "Interview";
      default:
        return key;
    }
  };

  // Render evaluations table for a specific university type
  const renderEvaluationsTable = (evals: StudentEvaluation[], type: UniversityType | string) => {
    const universityType = type as UniversityType;
    
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Evaluation Date</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Academics</TableHead>
              <TableHead>Extracurriculars</TableHead>
              <TableHead>{universityType === 'ucSystem' ? 'Personal Talents' : 'Athletics'}</TableHead>
              <TableHead>Personal Qualities</TableHead>
              <TableHead>{universityType === 'ucSystem' ? 'Personal Insight Questions (PIQs)' : 'Recommendations'}</TableHead>
              {universityType !== 'ucSystem' && <TableHead>Interview</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evals.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell className="font-medium">{evaluation.student_name}</TableCell>
                <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
                <TableCell className="font-semibold">{evaluation.total_score}</TableCell>
                <TableCell>{evaluation.academics_score}</TableCell>
                <TableCell>{evaluation.extracurriculars_score}</TableCell>
                <TableCell>{evaluation.athletics_score}</TableCell>
                <TableCell>{evaluation.personal_qualities_score}</TableCell>
                <TableCell>{evaluation.recommendations_score}</TableCell>
                {universityType !== 'ucSystem' && <TableCell>{evaluation.interview_score}</TableCell>}
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleExportPDF(evaluation)}
                    title="Export Evaluation as PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Create university type tabs
  const renderUniversityTypeTabs = () => {
    return (
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
          size="sm"
        >
          所有评估
        </Button>
        {universityTypes.map(type => (
          <Button
            key={type}
            variant={activeTab === type ? 'default' : 'outline'}
            onClick={() => setActiveTab(type as UniversityType)}
            size="sm"
          >
            {getUniversityTypeDisplay(type as UniversityType)}
          </Button>
        ))}
      </div>
    );
  };

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
            {renderUniversityTypeTabs()}
            
            {activeTab === 'all' ? (
              // Render sections for each university type
              Object.entries(groupedEvaluations).map(([type, evals]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-lg font-medium">{getUniversityTypeDisplay(type as UniversityType)}</h3>
                  {renderEvaluationsTable(evals, type)}
                </div>
              ))
            ) : (
              // Render only the active tab's evaluations
              groupedEvaluations[activeTab] && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{getUniversityTypeDisplay(activeTab as UniversityType)}</h3>
                  {renderEvaluationsTable(groupedEvaluations[activeTab], activeTab)}
                </div>
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
