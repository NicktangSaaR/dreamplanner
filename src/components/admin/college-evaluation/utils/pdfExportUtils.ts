
import jsPDF from 'jspdf';
import { StudentEvaluation } from "../types";
import autoTable from 'jspdf-autotable';

export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Harvard University Undergraduate Admission Evaluation', 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 30);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 40);
  
  // Add scores table
  autoTable(doc, {
    startY: 50,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: [
      ['Academics', evaluation.academics_score],
      ['Extracurriculars', evaluation.extracurriculars_score],
      ['Athletics', evaluation.athletics_score],
      ['Personal Qualities', evaluation.personal_qualities_score],
      ['Recommendations', evaluation.recommendations_score],
      ['Interview', evaluation.interview_score],
      ['Total Score', evaluation.total_score],
    ],
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
  doc.save(`${evaluation.student_name}_Harvard_Evaluation.pdf`);
};
