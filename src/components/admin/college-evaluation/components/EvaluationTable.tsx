
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { StudentEvaluation, UniversityType } from "../types";
import { getCriteriaLabel } from "../utils/displayUtils";
import { EvaluationRow } from "./EvaluationRow";

interface EvaluationTableProps {
  evaluations: StudentEvaluation[];
  universityType: UniversityType | string;
}

export const EvaluationTable = ({ evaluations, universityType }: EvaluationTableProps) => {
  const hasUcSystemEval = evaluations.some(e => (e.university_type || universityType) === 'ucSystem');

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Evaluation Date</TableHead>
            <TableHead>University Type</TableHead>
            <TableHead>Total Score (Total/Average)</TableHead>
            <TableHead>Academics</TableHead>
            <TableHead>Extracurriculars</TableHead>
            <TableHead>Athletics/Talents</TableHead>
            <TableHead>Personal Qualities</TableHead>
            <TableHead>Recommendations/PIQs</TableHead>
            {!hasUcSystemEval && <TableHead>Interview</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <EvaluationRow 
              key={evaluation.id} 
              evaluation={evaluation} 
              universityType={universityType} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
