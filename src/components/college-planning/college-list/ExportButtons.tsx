import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { CollegeApplication } from "./types";

interface ExportButtonsProps {
  applications: CollegeApplication[];
}

export default function ExportButtons({ applications }: ExportButtonsProps) {
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