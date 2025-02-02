import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, FilePdf, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import AddCollegeDialog from "./college-list/AddCollegeDialog";
import { getCollegeUrl } from "./college-list/useCollegeUrl";
import { CollegeFormValues } from "./college-list/collegeSchema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const categoryColors: Record<string, string> = {
  "Hard Reach": "bg-red-500",
  "Reach": "bg-orange-500",
  "Hard Target": "bg-yellow-500",
  "Target": "bg-green-500",
  "Safety": "bg-blue-500",
};

export default function CollegeListSection() {
  const { toast } = useToast();
  const { studentId } = useParams();

  const { data: applications, refetch } = useQuery({
    queryKey: ["college-applications", studentId],
    queryFn: async () => {
      console.log("Fetching college applications for student:", studentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const targetStudentId = studentId || user.id;

      const { data, error } = await supabase
        .from("college_applications")
        .select("*")
        .eq("student_id", targetStudentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      console.log("College applications:", data);
      return data;
    },
  });

  const onSubmit = async (values: CollegeFormValues) => {
    try {
      console.log("Submitting application:", values);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const targetStudentId = studentId || user.id;
      const collegeUrl = await getCollegeUrl(values.college_name);
      
      const applicationData = {
        college_name: values.college_name,
        major: values.major,
        degree: values.degree,
        category: values.category,
        college_url: collegeUrl,
        student_id: targetStudentId
      };

      const { error } = await supabase
        .from("college_applications")
        .insert(applicationData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application added successfully",
      });
      
      refetch();
    } catch (error) {
      console.error("Error adding application:", error);
      toast({
        title: "Error",
        description: "Failed to add college application",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting application:", id);
      const { error } = await supabase
        .from("college_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application removed successfully",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to remove college application",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    if (!applications?.length) return;

    const data = applications.map(app => ({
      'College Name': app.college_name,
      'Major': app.major,
      'Degree': app.degree,
      'Category': app.category,
      'College URL': app.college_url
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'College List');
    XLSX.writeFile(wb, 'college_list.xlsx');
  };

  const printAsPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">College List</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={printAsPDF}>
            <FilePdf className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <AddCollegeDialog onSubmit={onSubmit} />
        </div>
      </div>

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
                    onClick={() => handleDelete(app.id)}
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

      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
          }
          body * {
            visibility: hidden;
          }
          .print-section,
          .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}