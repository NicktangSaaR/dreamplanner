
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../types";
import autoTable from 'jspdf-autotable';
import { getUniversityCriteriaDescriptions } from "../evaluationConstants";

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

// Function to get criteria key from database column name
const getCriteriaKeyFromColumn = (columnName: string): string => {
  switch (columnName) {
    case 'academics_score':
      return 'academics';
    case 'extracurriculars_score':
      return 'extracurriculars';
    case 'athletics_score':
      return 'athletics';
    case 'personal_qualities_score':
      return 'personalQualities';
    case 'recommendations_score':
      return 'recommendations';
    case 'interview_score':
      return 'interview';
    default:
      return '';
  }
};

// Function to get criteria description for a specific score
const getCriteriaDescription = (
  criteriaKey: string,
  score: number,
  universityType: UniversityType
): string => {
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  return descriptions[criteriaKey]?.[score] || "";
};

export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const doc = new jsPDF();
  const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
  
  // Add title
  doc.setFontSize(18);
  const universityTypeDisplay = getUniversityTypeDisplay(universityType);
  doc.text(`US Undergraduate Admission Evaluation - ${universityTypeDisplay}`, 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 30);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 40);
  
  // Prepare table rows based on university type
  const criteriaColumns = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only include interview for non-UC System
  if (universityType !== 'ucSystem') {
    criteriaColumns.push('interview_score');
  }
  
  const tableRows = criteriaColumns.map(column => {
    const score = evaluation[column];
    const label = getCriteriaLabel(column, universityType);
    return [label, score];
  });
  
  // Add total score
  tableRows.push([getCriteriaLabel('total_score', universityType), evaluation.total_score]);
  
  // Add scores table with appropriate labels based on university type
  autoTable(doc, {
    startY: 50,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Get final Y position after the scores table
  let finalY = (doc as any).lastAutoTable?.finalY || 130;
  
  // Add detailed criteria descriptions
  doc.setFontSize(14);
  doc.text('Detailed Scoring Criteria Descriptions:', 15, finalY + 10);
  finalY += 20;
  
  // Loop through each criteria and add its description
  criteriaColumns.forEach(column => {
    if (column === 'interview_score' && universityType === 'ucSystem') {
      return; // Skip interview for UC System
    }
    
    const criteriaKey = getCriteriaKeyFromColumn(column);
    const score = evaluation[column] as number;
    const label = getCriteriaLabel(column, universityType);
    const description = getCriteriaDescription(criteriaKey, score, universityType);
    
    // Check if we need to add a new page
    if (finalY > 260) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${label} (Score: ${score})`, 15, finalY);
    doc.setFont(undefined, 'normal');
    
    // Add description with word wrapping
    const splitDescription = doc.splitTextToSize(description, 180);
    finalY += 5;
    doc.setFontSize(10);
    doc.text(splitDescription, 15, finalY);
    
    // Update Y position for next criteria
    finalY += splitDescription.length * 5 + 10;
  });
  
  // Add comments section
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Comments:', 15, finalY);
  doc.setFont(undefined, 'normal');
  
  // Add comments with word wrapping
  const splitComments = doc.splitTextToSize(evaluation.comments || 'None', 180);
  doc.setFontSize(10);
  doc.text(splitComments, 15, finalY + 10);
  
  // Save the PDF
  doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
};
