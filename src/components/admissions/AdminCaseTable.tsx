import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, Eye } from "lucide-react";
import { AdmissionCase } from "./types";

interface AdminCaseTableProps {
  cases: AdmissionCase[];
  selectedIds: number[];
  onSelectChange: (ids: number[]) => void;
  onView: (caseItem: AdmissionCase) => void;
  onEdit: (caseItem: AdmissionCase) => void;
  onDelete: (id: number) => void;
  searchTerm: string;
}

export default function AdminCaseTable({ 
  cases, 
  selectedIds, 
  onSelectChange, 
  onView, 
  onEdit, 
  onDelete,
  searchTerm 
}: AdminCaseTableProps) {
  const filteredCases = cases.filter(c => {
    const s = searchTerm.toLowerCase();
    return !searchTerm || 
      c.university.toLowerCase().includes(s) || 
      c.major?.toLowerCase().includes(s) ||
      c.country.toLowerCase().includes(s);
  });

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCases.length) {
      onSelectChange([]);
    } else {
      onSelectChange(filteredCases.map(c => c.id));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedIds.length === filteredCases.length && filteredCases.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>年份</TableHead>
            <TableHead>国家</TableHead>
            <TableHead>大学</TableHead>
            <TableHead>专业</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                暂无案例数据
              </TableCell>
            </TableRow>
          ) : (
            filteredCases.map(caseItem => (
              <TableRow key={caseItem.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(caseItem.id)}
                    onCheckedChange={() => toggleSelect(caseItem.id)}
                  />
                </TableCell>
                <TableCell>{caseItem.year}</TableCell>
                <TableCell>{caseItem.country}</TableCell>
                <TableCell className="font-medium">{caseItem.university}</TableCell>
                <TableCell>{caseItem.major || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onView(caseItem)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(caseItem)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (confirm('确定删除此案例？')) {
                          onDelete(caseItem.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
