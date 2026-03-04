
import { 
  GRADE_TO_GPA, 
  GRADE_TO_GPA_433,
  COURSE_TYPE_BONUS, 
  SPECIAL_GRADES 
} from "../constants/gradeConstants";
import { Course } from "../../types/course";
import { GPACalculationType } from "../GPATypeSelector";

/**
 * Converts a percentage grade to GPA
 */
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

/**
 * Calculates the GPA for a grade with course type and grade type
 */
export function calculateGPA(grade: string, courseType: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, courseType);
  }
  
  const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

/**
 * Calculates unweighted GPA regardless of course type
 */
export function calculateUnweightedGPA(grade: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

/**
 * Calculates US College GPA (4.0 scale)
 */
export function calculateCollegeGPA40(grade: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

/**
 * Calculates US College GPA (4.33 scale)
 */
export function calculateCollegeGPA433(grade: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    // For 4.33 scale, A+ (97+) = 4.33, everything else follows standard conversion
    if (numericGrade >= 97) return 4.33;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  return GRADE_TO_GPA_433[grade.toUpperCase()] || 0;
}

/**
 * Calculates base GPA for a UC-eligible course (grades 10-12 only)
 * Returns { baseGPA, isHonors } for use in weighted/capped calculations
 */
export function getUCCourseGPA(course: Course): { baseGPA: number; isHonors: boolean } | null {
  if (SPECIAL_GRADES.includes(course.grade)) return null;
  
  // UC GPA only counts courses from grades 10-12
  if (course.grade_level === '9') return null;
  
  let baseGPA = 0;
  if (course.grade_type === '100-point') {
    const numericGrade = parseFloat(course.grade);
    if (isNaN(numericGrade)) return null;
    baseGPA = getGPAFromPercentage(numericGrade, 'Regular');
  } else {
    baseGPA = GRADE_TO_GPA[course.grade.toUpperCase()] || 0;
  }
  
  const isHonors = ['Honors', 'AP/IB', 'Post AP'].includes(course.course_type);
  return { baseGPA, isHonors };
}

/**
 * Calculates Weighted UC GPA (uncapped honors bonus)
 */
export function calculateWeightedUCGPA(courses: Course[]): number {
  const validCourses = courses.filter(c => !SPECIAL_GRADES.includes(c.grade));
  let totalGPA = 0;
  let count = 0;

  validCourses.forEach(course => {
    const result = getUCCourseGPA(course);
    if (!result) return;
    const bonus = result.isHonors ? 1.0 : 0;
    totalGPA += result.baseGPA + bonus;
    count++;
  });

  return count > 0 ? Number((totalGPA / count).toFixed(2)) : 0;
}

/**
 * Calculates Capped UC GPA (max 8 semesters of honors bonus, max GPA 4.5)
 */
export function calculateCappedUCGPA(courses: Course[]): number {
  const validCourses = courses.filter(c => !SPECIAL_GRADES.includes(c.grade));
  let totalGPA = 0;
  let count = 0;
  let honorsCount = 0;

  // Sort honors courses by base GPA descending to apply bonus to best courses first
  const courseResults = validCourses
    .map(course => ({ course, result: getUCCourseGPA(course) }))
    .filter((c): c is { course: Course; result: { baseGPA: number; isHonors: boolean } } => c.result !== null);

  // Count honors-eligible courses
  const honorsCourses = courseResults.filter(c => c.result.isHonors).sort((a, b) => b.result.baseGPA - a.result.baseGPA);
  const nonHonorsCourses = courseResults.filter(c => !c.result.isHonors);

  // Apply bonus to up to 8 honors courses
  honorsCourses.forEach(({ result }) => {
    const bonus = honorsCount < 8 ? 1.0 : 0;
    totalGPA += result.baseGPA + bonus;
    honorsCount++;
    count++;
  });

  nonHonorsCourses.forEach(({ result }) => {
    totalGPA += result.baseGPA;
    count++;
  });

  return count > 0 ? Number((totalGPA / count).toFixed(2)) : 0;
}

/**
 * Calculates the GPA for a specific academic year
 */
export function calculateYearGPA(courses: Course[], academicYear: string, gpaType: GPACalculationType): number {
  const yearCourses = courses.filter(course => 
    course.academic_year === academicYear && !SPECIAL_GRADES.includes(course.grade)
  );
  
  if (yearCourses.length === 0) return 0;

  let totalGPA = 0;
  let validCourseCount = 0;

  // For UC GPA types, use dedicated functions
  if (gpaType === "uc-weighted") {
    return calculateWeightedUCGPA(yearCourses);
  }
  if (gpaType === "uc-capped") {
    return calculateCappedUCGPA(yearCourses);
  }

  yearCourses.forEach(course => {
    let courseGPA = 0;
    
    if (gpaType === "unweighted-us") {
      courseGPA = calculateUnweightedGPA(course.grade, course.grade_type);
    } else if (gpaType === "college-gpa-4.0") {
      courseGPA = calculateCollegeGPA40(course.grade, course.grade_type);
    } else if (gpaType === "college-gpa-4.33") {
      courseGPA = calculateCollegeGPA433(course.grade, course.grade_type);
    } else {
      courseGPA = course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type);
    }
    
    totalGPA += courseGPA;
  });
  
  return yearCourses.length > 0 ? Number((totalGPA / yearCourses.length).toFixed(2)) : 0;
}

/**
 * Calculates 100-point average from a list of courses
 */
export function calculate100PointAverage(courses: Course[]): number | null {
  // Filter out special grade courses and check if remaining courses use 100-point scale
  const validCourses = courses.filter(course => !SPECIAL_GRADES.includes(course.grade));
  const all100Point = validCourses.every(course => course.grade_type === '100-point');
  
  if (!all100Point || validCourses.length === 0) return null;

  const totalPoints = validCourses.reduce((sum, course) => {
    const points = parseFloat(course.grade);
    return isNaN(points) ? sum : sum + points;
  }, 0);

  return Number((totalPoints / validCourses.length).toFixed(2));
}

/**
 * Calculates 100-point average for a specific academic year
 */
export function calculateYear100PointAverage(courses: Course[], academicYear: string): number | null {
  const yearCourses = courses.filter(course => 
    course.academic_year === academicYear && !SPECIAL_GRADES.includes(course.grade)
  );
  return calculate100PointAverage(yearCourses);
}

/**
 * Calculates overall GPA based on the selected GPA type
 */
export function calculateOverallGPA(courses: Course[], gpaType: GPACalculationType): number {
  const validCourses = courses.filter(course => !SPECIAL_GRADES.includes(course.grade));
  if (validCourses.length === 0) return 0;
  
  if (gpaType === "100-point") {
    const average = calculate100PointAverage(validCourses);
    return average !== null ? average : 0;
  }

  if (gpaType === "uc-weighted") {
    return calculateWeightedUCGPA(validCourses);
  }
  if (gpaType === "uc-capped") {
    return calculateCappedUCGPA(validCourses);
  }

  let totalGPA = 0;
  let validCourseCount = 0;

  validCourses.forEach(course => {
    let courseGPA = 0;
    
    if (gpaType === "unweighted-us") {
      courseGPA = calculateUnweightedGPA(course.grade, course.grade_type);
    } else if (gpaType === "college-gpa-4.0") {
      courseGPA = calculateCollegeGPA40(course.grade, course.grade_type);
    } else if (gpaType === "college-gpa-4.33") {
      courseGPA = calculateCollegeGPA433(course.grade, course.grade_type);
    } else {
      courseGPA = course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type);
    }
    
    totalGPA += courseGPA;
  });
  
  return validCourses.length > 0 ? Number((totalGPA / validCourses.length).toFixed(2)) : 0;
}

/**
 * Helper functions for GPA display
 */
export function getGPAScale(gpaType: GPACalculationType): string {
  if (gpaType === "100-point") return "100";
  if (gpaType === "college-gpa-4.33") return "4.33";
  if (gpaType === "uc-capped") return "4.5";
  return "4.0";
}

export function getGPATypeLabel(gpaType: GPACalculationType): string {
  switch (gpaType) {
    case "100-point": return "100分制平均分";
    case "unweighted-us": return "Unweighted GPA-US";
    case "uc-weighted": return "Weighted UC GPA";
    case "uc-capped": return "Capped UC GPA";
    case "college-gpa-4.0": return "US College GPA (4.0)";
    case "college-gpa-4.33": return "US College GPA (4.33)";
    default: return "GPA";
  }
}
