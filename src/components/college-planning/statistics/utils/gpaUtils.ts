
import { GRADE_TO_GPA, GRADE_TO_GPA_433, COURSE_TYPE_BONUS } from "../../academics/constants/gradeConstants";

export function getGPAFromPercentage(percentage: number, courseType: string = 'Regular'): number {
  let baseGPA = 0;
  
  if (percentage >= 97) baseGPA = 4.0;      // A+
  else if (percentage >= 93) baseGPA = 4.0;  // A
  else if (percentage >= 90) baseGPA = 3.7;  // A-
  else if (percentage >= 87) baseGPA = 3.3;  // B+
  else if (percentage >= 83) baseGPA = 3.0;  // B
  else if (percentage >= 80) baseGPA = 2.7;  // B-
  else if (percentage >= 77) baseGPA = 2.3;  // C+
  else if (percentage >= 73) baseGPA = 2.0;  // C
  else if (percentage >= 70) baseGPA = 1.7;  // C-
  else if (percentage >= 67) baseGPA = 1.3;  // D+
  else if (percentage >= 63) baseGPA = 1.0;  // D
  else if (percentage >= 60) baseGPA = 0.7;  // D-
  else baseGPA = 0.0;                        // F

  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

export function calculateGPA(grade: string, courseType: string, gradeType?: string): number {
  if (grade === "In Progress" || grade === "Pass/Fail" || grade === "Drop") return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, courseType);
  }
  
  const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

export function calculateCollegeGPA40(grade: string, gradeType?: string): number {
  if (grade === "In Progress" || grade === "Pass/Fail" || grade === "Drop") return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

export function calculateCollegeGPA433(grade: string, gradeType?: string): number {
  if (grade === "In Progress" || grade === "Pass/Fail" || grade === "Drop") return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    // For 4.33 scale, A+ (97+) = 4.33, everything else follows standard conversion
    if (numericGrade >= 97) return 4.33;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  
  return GRADE_TO_GPA_433[grade.toUpperCase()] || 0;
}

export function getGPALabel(gpaType: string): string {
  switch (gpaType) {
    case "100-point": return "100分制平均分";
    case "unweighted-us": return "Unweighted GPA";
    case "uc-gpa": return "UC GPA";
    case "college-gpa-4.0": return "US College GPA (4.0)";
    case "college-gpa-4.33": return "US College GPA (4.33)";
    default: return "GPA";
  }
}

export function getGPAScale(gpaType: string): string {
  if (gpaType === "100-point") return "";
  if (gpaType === "college-gpa-4.33") return "/4.33";
  return "/4.0";
}

export function getCourseTypeDistribution(courses: Array<{ course_type: string }>): { [key: string]: number } {
  return courses.reduce((acc: { [key: string]: number }, course) => {
    const type = course.course_type || 'Regular';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}
