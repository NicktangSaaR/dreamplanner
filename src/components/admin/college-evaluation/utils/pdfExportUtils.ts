
import jsPDF from 'jspdf';
import { StudentEvaluation } from "../types";
import { autoTable } from 'jspdf-autotable';

export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('哈佛大学本科录取评估表', 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`学生姓名: ${evaluation.student_name}`, 15, 30);
  doc.text(`评估日期: ${new Date(evaluation.evaluation_date).toLocaleDateString('zh-CN')}`, 15, 40);
  
  // Add scores table
  autoTable(doc, {
    startY: 50,
    head: [['评估项目', '得分 (1为最高，6为最低)']],
    body: [
      ['学术表现（Academics）', evaluation.academics_score],
      ['课外活动（Extracurriculars）', evaluation.extracurriculars_score],
      ['运动（Athletics）', evaluation.athletics_score],
      ['个人特质（Personal Qualities）', evaluation.personal_qualities_score],
      ['推荐信（Recommendations）', evaluation.recommendations_score],
      ['面试（Interview）', evaluation.interview_score],
      ['总分', evaluation.total_score],
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Add comments section
  const commentY = doc.lastAutoTable?.finalY || 130;
  
  doc.text('评估意见:', 15, commentY + 10);
  
  // Add comments with word wrapping
  const splitComments = doc.splitTextToSize(evaluation.comments || '无', 180);
  doc.text(splitComments, 15, commentY + 20);
  
  // Save the PDF
  doc.save(`${evaluation.student_name}_哈佛评估表.pdf`);
};
