import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CourseTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Course Name</TableHead>
        <TableHead>Grade Type</TableHead>
        <TableHead>Grade</TableHead>
        <TableHead>Course Type</TableHead>
        <TableHead>Grade Level</TableHead>
        <TableHead>Academic Year</TableHead>
        <TableHead>Semester</TableHead>
        <TableHead>GPA</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}