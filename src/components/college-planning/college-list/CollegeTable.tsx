import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CollegeApplication } from "./types";

const categoryColors: Record<string, string> = {
  "Hard Reach": "bg-red-500",
  "Reach": "bg-orange-500",
  "Hard Target": "bg-yellow-500",
  "Target": "bg-green-500",
  "Safety": "bg-blue-500",
};

interface CollegeTableProps {
  applications: CollegeApplication[];
  onDelete: (id: string) => Promise<void>;
}

export default function CollegeTable({ applications, onDelete }: CollegeTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>College Name</TableHead>
            <TableHead>Major</TableHead>
            <TableHead>Degree</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>College URL</TableHead>
            <TableHead className="print:hidden">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications?.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.college_name}</TableCell>
              <TableCell>{app.major}</TableCell>
              <TableCell>{app.degree}</TableCell>
              <TableCell>
                <Badge className={`${categoryColors[app.category]} text-white`}>
                  {app.category}
                </Badge>
              </TableCell>
              <TableCell>
                <a
                  href={app.college_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {app.college_url}
                </a>
              </TableCell>
              <TableCell className="print:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(app.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}