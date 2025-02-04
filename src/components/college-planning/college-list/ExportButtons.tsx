
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { CollegeApplication, StudentProfile } from "./types";

interface ExportButtonsProps {
  applications: CollegeApplication[];
  profile: StudentProfile | null;
}

export function ExportButtons({ applications, profile }: ExportButtonsProps) {
  const exportToExcel = () => {
    if (!applications?.length) return;

    // Create profile worksheet
    const profileData = [
      ['Student Profile', ''],
      ['Name', profile?.full_name || 'Not set'],
      ['Grade', profile?.grade || 'Not set'],
      ['School', profile?.school || 'Not set'],
      ['Interested Majors', profile?.interested_majors?.join(', ') || 'Not set'],
      ['', ''], // Empty row for spacing
    ];

    // Create applications worksheet data
    const applicationsData = applications.map(app => ({
      'College Name': app.college_name,
      'Major': app.major,
      'Degree': app.degree,
      'Category': app.category,
      'College URL': app.college_url
    }));

    // Create workbook with both worksheets
    const wb = XLSX.utils.book_new();
    
    // Add profile worksheet
    const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
    XLSX.utils.book_append_sheet(wb, wsProfile, 'Student Profile');
    
    // Add applications worksheet
    const wsApplications = XLSX.utils.json_to_sheet(applicationsData);
    XLSX.utils.book_append_sheet(wb, wsApplications, 'College List');
    
    XLSX.writeFile(wb, 'college_list.xlsx');
  };

  const printAsPDF = () => {
    window.print();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
      <Button variant="outline" size="sm" onClick={printAsPDF}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </>
  );
}
