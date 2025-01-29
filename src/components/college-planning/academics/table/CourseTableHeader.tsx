import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CourseTableHeader() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead className="w-[200px]">Course Name</TableHead>
        <TableHead className="w-[120px]">Grade Type</TableHead>
        <TableHead className="w-[100px]">Grade</TableHead>
        <TableHead className="w-[120px]">Course Type</TableHead>
        <TableHead className="w-[120px]">Grade Level</TableHead>
        <TableHead className="w-[120px]">Academic Year</TableHead>
        <TableHead className="w-[100px]">Semester</TableHead>
        <TableHead className="w-[80px] text-right">GPA</TableHead>
        <TableHead className="w-[100px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}