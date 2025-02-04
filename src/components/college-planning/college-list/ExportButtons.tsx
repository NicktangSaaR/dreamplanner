
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

    // Create profile worksheet with better formatting
    const profileData = [
      ['Student Information', ''], // Title row
      ['', ''], // Empty row for spacing
      ['Full Name:', profile?.full_name || 'Not set'],
      ['Grade Level:', profile?.grade || 'Not set'],
      ['Current School:', profile?.school || 'Not set'],
      ['Interested Majors:', profile?.interested_majors?.join(', ') || 'Not set'],
      ['', ''], // Empty row for spacing
    ];

    // Create applications worksheet data with more details
    const applicationsData = applications.map(app => ({
      'College Name': app.college_name,
      'Application Category': app.category || 'Not set',
      'Intended Major': app.major,
      'Degree Type': app.degree,
      'Institution Type': app.institution_type || 'Not specified',
      'Location': app.city && app.state ? `${app.city}, ${app.state}` : (app.state || 'Not specified'),
      'Average GPA': app.avg_gpa || 'Not available',
      'SAT (75th Percentile)': app.sat_75th || 'Not available',
      'ACT (75th Percentile)': app.act_75th || 'Not available',
      'Test Optional': app.test_optional ? 'Yes' : 'No',
      'College Website': app.college_url || 'Not available',
      'Additional Notes': app.notes || ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add profile worksheet with column widths
    const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
    wsProfile['!cols'] = [{ wch: 20 }, { wch: 50 }]; // Set column widths
    XLSX.utils.book_append_sheet(wb, wsProfile, 'Student Profile');
    
    // Add applications worksheet with formatting
    const wsApplications = XLSX.utils.json_to_sheet(applicationsData);
    wsApplications['!cols'] = [
      { wch: 25 }, // College Name
      { wch: 15 }, // Category
      { wch: 25 }, // Major
      { wch: 15 }, // Degree
      { wch: 15 }, // Institution Type
      { wch: 25 }, // Location
      { wch: 12 }, // GPA
      { wch: 12 }, // SAT 75th
      { wch: 12 }, // ACT 75th
      { wch: 12 }, // Test Optional
      { wch: 30 }, // Website
      { wch: 50 }  // Notes
    ];
    XLSX.utils.book_append_sheet(wb, wsApplications, 'College List');
    
    // Apply some basic styling
    ['A1:K1'].forEach(range => {
      const range_addr = XLSX.utils.decode_range(range);
      for(let R = range_addr.s.r; R <= range_addr.e.r; ++R) {
        for(let C = range_addr.s.c; C <= range_addr.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({r:R, c:C});
          if(!wsApplications[addr]) continue;
          wsApplications[addr].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "EEEEEE" } }
          };
        }
      }
    });
    
    XLSX.writeFile(wb, `${profile?.full_name || 'Student'}_College_List.xlsx`);
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
