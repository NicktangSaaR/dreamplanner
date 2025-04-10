
// Grade to GPA conversion for letter grades
export const GRADE_TO_GPA: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
};

// Bonus points for course types
export const COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 0.5,
  'AP/IB': 1.0
};

// UC GPA specific bonus
export const UC_COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 1.0,
  'AP/IB': 1.0
};

// Special grade designations that don't count in GPA
export const SPECIAL_GRADES = ['In Progress', 'Pass/Fail', 'Drop'];
