
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../types";
import autoTable from 'jspdf-autotable';

const getUniversityTypeDisplay = (type?: UniversityType): string => {
  if (!type) return "General US University";
  
  switch (type) {
    case 'ivyLeague':
      return "Ivy League Universities";
    case 'top30':
      return "Top 20-30 Universities";
    case 'ucSystem':
      return "UC System Universities";
    default:
      return "General US University";
  }
};

// Function to get appropriate criteria label based on university type
const getCriteriaLabel = (key: string, universityType?: UniversityType): string => {
  if (universityType === 'ucSystem') {
    switch (key) {
      case 'recommendations_score':
        return 'Personal Insight Questions (PIQs)';
      case 'athletics_score':
        return 'Personal Talents';
      case 'interview_score':
        return 'Not Applicable for UC System';
      default:
        break;
    }
  }
  
  switch (key) {
    case 'academics_score':
      return 'Academics';
    case 'extracurriculars_score':
      return 'Extracurriculars';
    case 'athletics_score':
      return 'Athletics';
    case 'personal_qualities_score':
      return 'Personal Qualities';
    case 'recommendations_score':
      return 'Recommendations';
    case 'interview_score':
      return 'Interview';
    case 'total_score':
      return 'Total Score';
    default:
      return key;
  }
};

export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  const universityTypeDisplay = getUniversityTypeDisplay(evaluation.university_type as UniversityType);
  doc.text(`US Undergraduate Admission Evaluation - ${universityTypeDisplay}`, 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 30);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 40);
  
  // Prepare table rows based on university type
  const tableRows = [
    [getCriteriaLabel('academics_score', evaluation.university_type as UniversityType), evaluation.academics_score],
    [getCriteriaLabel('extracurriculars_score', evaluation.university_type as UniversityType), evaluation.extracurriculars_score],
    [getCriteriaLabel('athletics_score', evaluation.university_type as UniversityType), evaluation.athletics_score],
    [getCriteriaLabel('personal_qualities_score', evaluation.university_type as UniversityType), evaluation.personal_qualities_score],
    [getCriteriaLabel('recommendations_score', evaluation.university_type as UniversityType), evaluation.recommendations_score],
  ];
  
  // Only include interview for non-UC System
  if (evaluation.university_type !== 'ucSystem') {
    tableRows.push([getCriteriaLabel('interview_score', evaluation.university_type as UniversityType), evaluation.interview_score]);
  }
  
  // Add total score
  tableRows.push([getCriteriaLabel('total_score', evaluation.university_type as UniversityType), evaluation.total_score]);
  
  // Add scores table with appropriate labels based on university type
  autoTable(doc, {
    startY: 50,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Add comments section
  const finalY = (doc as any).lastAutoTable?.finalY || 130;
  
  doc.text('Comments:', 15, finalY + 10);
  
  // Add comments with word wrapping
  const splitComments = doc.splitTextToSize(evaluation.comments || 'None', 180);
  doc.text(splitComments, 15, finalY + 20);
  
  // Save the PDF
  doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
};
