import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, Settings, Sparkles } from "lucide-react";
import { useAdmissionCases } from "@/components/admissions/hooks/useAdmissionCases";
import { useProfile } from "@/hooks/useProfile";
import CaseCard from "@/components/admissions/CaseCard";
import CaseDetailDialog from "@/components/admissions/CaseDetailDialog";
import CaseFormDialog from "@/components/admissions/CaseFormDialog";
import AIGenerateDialog from "@/components/admissions/AIGenerateDialog";
import AdminCaseTable from "@/components/admissions/AdminCaseTable";
import { AdmissionCase, NewCaseForm, initialCaseForm } from "@/components/admissions/types";
import MainNav from "@/components/layout/MainNav";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admissions() {
  const { cases, isLoading, saveCase, deleteCase } = useAdmissionCases();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
    });
  }, []);
  
  const isAdmin = profile?.user_type === 'admin';
  const isAuthenticated = !!profile;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [viewingCase, setViewingCase] = useState<AdmissionCase | null>(null);
  const [editingCase, setEditingCase] = useState<AdmissionCase | null>(null);
  const [aiGeneratedData, setAiGeneratedData] = useState<Partial<NewCaseForm> | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const years = ['all', ...new Set(cases.map(c => c.year))];
  const countries = ['all', ...new Set(cases.map(c => c.country))];

  const filteredCases = cases.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      c.university.toLowerCase().includes(s) || 
      c.major?.toLowerCase().includes(s) || 
      c.profile_style.toLowerCase().includes(s);
    const matchYear = filterYear === 'all' || c.year === filterYear;
    const matchCountry = filterCountry === 'all' || c.country === filterCountry;
    return matchSearch && matchYear && matchCountry;
  });

  const handleViewCase = (caseItem: AdmissionCase) => {
    setViewingCase(caseItem);
    setShowDetailDialog(true);
  };

  const handleEditCase = (caseItem: AdmissionCase) => {
    setEditingCase(caseItem);
    setShowFormDialog(true);
  };

  const handleSaveCase = async (data: NewCaseForm) => {
    const success = await saveCase(data, editingCase?.id);
    if (success) {
      setEditingCase(null);
    }
    return success;
  };

  const handleExportPDF = () => {
    const selectedData = cases.filter(c => selectedCases.includes(c.id));
    if (selectedData.length === 0) {
      return;
    }
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>升学录取案例集锦</title>
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
          .case { page-break-inside: avoid; margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .case h2 { color: #1a365d; margin-bottom: 10px; }
          .case-meta { color: #666; margin-bottom: 15px; }
          .case-section { margin-top: 15px; }
          .case-section h3 { font-size: 14px; color: #333; margin-bottom: 8px; }
          .case-section p { color: #555; line-height: 1.6; }
          .activities li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1 style="text-align: center; margin-bottom: 40px;">升学录取案例集锦</h1>
    `;

    selectedData.forEach(c => {
      htmlContent += `
        <div class="case">
          <h2>${c.university}</h2>
          <div class="case-meta">${c.year} | ${c.country}${c.major ? ` | ${c.major}` : ''}</div>
          <div class="case-section">
            <h3>学生画像</h3>
            <p>${c.profile_style}</p>
          </div>
          <div class="case-section">
            <h3>学术背景</h3>
            <p>${c.academic_background}</p>
          </div>
          ${c.activities.length > 0 ? `
            <div class="case-section">
              <h3>课外活动</h3>
              <ul class="activities">
                ${c.activities.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    });

    htmlContent += '</body></html>';

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `案例集锦_${selectedData.length}个.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav isAuthenticated={isAuthenticated} userId={userId} onLogout={handleLogout} />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav isAuthenticated={isAuthenticated} userId={userId} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">录取案例展示</h1>
          <p className="text-muted-foreground">探索我们学生的成功故事</p>
        </div>

        {isAdmin ? (
          <Tabs defaultValue="showcase" className="space-y-6">
            <TabsList>
              <TabsTrigger value="showcase">前台展示</TabsTrigger>
              <TabsTrigger value="manage">
                <Settings className="h-4 w-4 mr-2" />
                后台管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="showcase">
              <PublicShowcase 
                cases={filteredCases}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                filterCountry={filterCountry}
                setFilterCountry={setFilterCountry}
                years={years}
                countries={countries}
                onViewCase={handleViewCase}
              />
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索案例..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCases.length > 0 && (
                    <Button variant="outline" onClick={handleExportPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      导出选中 ({selectedCases.length})
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowAIDialog(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI生成
                  </Button>
                  <Button onClick={() => { setEditingCase(null); setAiGeneratedData(null); setShowFormDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加案例
                  </Button>
                </div>
              </div>

              <AdminCaseTable 
                cases={cases}
                selectedIds={selectedCases}
                onSelectChange={setSelectedCases}
                onView={handleViewCase}
                onEdit={handleEditCase}
                onDelete={deleteCase}
                searchTerm={searchTerm}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <PublicShowcase 
            cases={filteredCases}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            filterCountry={filterCountry}
            setFilterCountry={setFilterCountry}
            years={years}
            countries={countries}
            onViewCase={handleViewCase}
          />
        )}
      </div>

      <CaseDetailDialog 
        caseItem={viewingCase}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <CaseFormDialog 
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) {
            setEditingCase(null);
            setAiGeneratedData(null);
          }
        }}
        initialData={editingCase ? {
          year: editingCase.year,
          country: editingCase.country,
          university: editingCase.university,
          major: editingCase.major || '',
          offer_image: editingCase.offer_image || '',
          profile_style: editingCase.profile_style,
          academic_background: editingCase.academic_background,
          activities: editingCase.activities.length > 0 ? editingCase.activities : [''],
          courses: editingCase.courses.length > 0 ? editingCase.courses : ['']
        } : aiGeneratedData ? {
          ...initialCaseForm,
          ...aiGeneratedData,
        } : undefined}
        onSave={handleSaveCase}
        isEditing={!!editingCase}
      />

      <AIGenerateDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerated={(data) => {
          setAiGeneratedData(data);
          setShowFormDialog(true);
        }}
      />
    </div>
  );
}

interface PublicShowcaseProps {
  cases: AdmissionCase[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterYear: string;
  setFilterYear: (v: string) => void;
  filterCountry: string;
  setFilterCountry: (v: string) => void;
  years: string[];
  countries: string[];
  onViewCase: (c: AdmissionCase) => void;
}

function PublicShowcase({ 
  cases, searchTerm, setSearchTerm, filterYear, setFilterYear, 
  filterCountry, setFilterCountry, years, countries, onViewCase 
}: PublicShowcaseProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索大学、专业或关键词..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="年份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年份</SelectItem>
            {years.filter(y => y !== 'all').map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="国家" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部国家</SelectItem>
            {countries.filter(c => c !== 'all').map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无符合条件的案例
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map(caseItem => (
            <CaseCard 
              key={caseItem.id} 
              caseItem={caseItem} 
              onClick={() => onViewCase(caseItem)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
