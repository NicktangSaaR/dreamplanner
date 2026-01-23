import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { useAdmissionCases } from "@/components/admissions/hooks/useAdmissionCases";
import { AdmissionCase, NewCaseForm } from "@/components/admissions/types";
import AdminCaseTable from "@/components/admissions/AdminCaseTable";
import CaseFormDialog from "@/components/admissions/CaseFormDialog";
import CaseDetailDialog from "@/components/admissions/CaseDetailDialog";
import AIGenerateDialog from "@/components/admissions/AIGenerateDialog";
import { toast } from "sonner";

export default function AdmissionCaseManagement() {
  const { cases, isLoading, saveCase, deleteCase } = useAdmissionCases();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editingCase, setEditingCase] = useState<AdmissionCase | null>(null);
  const [viewingCase, setViewingCase] = useState<AdmissionCase | null>(null);
  const [aiGeneratedData, setAiGeneratedData] = useState<NewCaseForm | null>(null);

  const handleView = (caseItem: AdmissionCase) => {
    setViewingCase(caseItem);
    setShowDetailDialog(true);
  };

  const handleEdit = (caseItem: AdmissionCase) => {
    setEditingCase(caseItem);
    setShowFormDialog(true);
  };

  const handleAdd = () => {
    setEditingCase(null);
    setAiGeneratedData(null);
    setShowFormDialog(true);
  };

  const handleSave = async (data: NewCaseForm): Promise<boolean> => {
    const success = await saveCase(data, editingCase?.id);
    if (success) {
      setShowFormDialog(false);
      setEditingCase(null);
      setAiGeneratedData(null);
    }
    return success;
  };

  const handleDelete = async (id: number) => {
    await deleteCase(id);
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("请先选择要删除的案例");
      return;
    }
    if (!confirm(`确定删除选中的 ${selectedIds.length} 个案例？`)) return;
    
    for (const id of selectedIds) {
      await deleteCase(id);
    }
    setSelectedIds([]);
  };

  const handleAIGenerated = (data: Partial<NewCaseForm>) => {
    const fullData: NewCaseForm = {
      year: data.year || '',
      country: data.country || '',
      university: data.university || '',
      major: data.major || '',
      offer_image: data.offer_image || '',
      profile_style: data.profile_style || '',
      academic_background: data.academic_background || '',
      activities: data.activities || [''],
      courses: data.courses || [''],
    };
    setAiGeneratedData(fullData);
    setShowAIDialog(false);
    setEditingCase(null);
    setShowFormDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索大学、专业、国家..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中 ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowAIDialog(true)}>
            AI生成
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加案例
          </Button>
        </div>
      </div>

      <AdminCaseTable
        cases={cases}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
      />

      <CaseFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        initialData={editingCase ? {
          year: editingCase.year,
          country: editingCase.country,
          university: editingCase.university,
          major: editingCase.major || '',
          offer_image: editingCase.offer_image || '',
          profile_style: editingCase.profile_style,
          academic_background: editingCase.academic_background,
          activities: editingCase.activities.length > 0 ? editingCase.activities : [''],
          courses: editingCase.courses.length > 0 ? editingCase.courses : [''],
        } : aiGeneratedData || undefined}
        onSave={handleSave}
        isEditing={!!editingCase}
      />

      <CaseDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        caseItem={viewingCase}
      />

      <AIGenerateDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerated={handleAIGenerated}
      />
    </div>
  );
}
