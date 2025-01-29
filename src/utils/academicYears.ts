export const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => {
    const year = currentYear - 4 + i;
    return `${year}-${year + 1}`;
  });
};