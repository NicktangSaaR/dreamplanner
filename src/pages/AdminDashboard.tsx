import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import QuestionBankManagement from "@/components/admin/QuestionBankManagement";
import ProspectiveClientManagement from "@/components/admin/ProspectiveClientManagement";
import ArticleManagement from "@/components/admin/ArticleManagement";
import PlatformUpdateManagement from "@/components/admin/PlatformUpdateManagement";
import CollegeEvaluationManagement from "@/components/admin/college-evaluation/CollegeEvaluationManagement";
import StudentTodoManagement from "@/components/admin/StudentTodoManagement";
import ResumeManagement from "@/components/admin/resume/ResumeManagement";
import AdmissionCaseManagement from "@/components/admin/AdmissionCaseManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile && profile.user_type !== 'admin') {
      navigate('/');
    }
  }, [profile, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
        toast.error("登出失败");
      } else {
        toast.success("成功登出系统");
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      toast.error("登出时发生错误");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.user_type !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={handleLogout} 
          variant="outline"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </div>
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="student-todos">Student Todos</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="question-banks">Question Banks</TabsTrigger>
          <TabsTrigger value="prospective-clients">Prospective Clients</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="platform-updates">Platform Updates</TabsTrigger>
          <TabsTrigger value="college-evaluations">College Evaluations</TabsTrigger>
          <TabsTrigger value="admission-cases">Admission Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="student-todos" className="space-y-4">
          <StudentTodoManagement />
        </TabsContent>

        <TabsContent value="resume" className="space-y-4">
          <ResumeManagement />
        </TabsContent>

        <TabsContent value="question-banks" className="space-y-4">
          <QuestionBankManagement />
        </TabsContent>

        <TabsContent value="prospective-clients" className="space-y-4">
          <ProspectiveClientManagement />
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <ArticleManagement />
        </TabsContent>

        <TabsContent value="platform-updates" className="space-y-4">
          <PlatformUpdateManagement />
        </TabsContent>

        <TabsContent value="college-evaluations" className="space-y-4">
          <CollegeEvaluationManagement />
        </TabsContent>

        <TabsContent value="admission-cases" className="space-y-4">
          <AdmissionCaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
