
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
import { Pencil } from "lucide-react";
import { CollegeApplication, StudentProfile } from "./types";

const categoryColors: Record<string, string> = {
  "Hard Reach": "bg-red-500",
  "Reach": "bg-orange-500",
  "Hard Target": "bg-yellow-500",
  "Target": "bg-green-500",
  "Safety": "bg-blue-500",
};

interface CollegeTableProps {
  applications: CollegeApplication[];
  profile: StudentProfile | null;
  onDelete: (id: string) => Promise<void>;
  onEdit: (application: CollegeApplication) => void;
}

export default function CollegeTable({ applications, profile, onDelete, onEdit }: CollegeTableProps) {
  return (
    <div className="rounded-md border print-section">
      <div className="profile-section p-6">
        <h3 className="font-semibold">Student Profile</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="text-sm">{profile?.full_name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Grade</dt>
            <dd className="text-sm">{profile?.grade || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">School</dt>
            <dd className="text-sm">{profile?.school || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Interested Majors</dt>
            <dd className="text-sm">{profile?.interested_majors?.join(', ') || 'Not set'}</dd>
          </div>
        </dl>
      </div>

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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(app)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(app.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
