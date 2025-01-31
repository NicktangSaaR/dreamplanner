import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import QuestionBankManagement from "@/components/admin/QuestionBankManagement";
import ProspectiveClientManagement from "@/components/admin/ProspectiveClientManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
    }
  }, [profile, navigate]);

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

  if (!profile?.is_admin) {
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
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="question-banks">Question Banks</TabsTrigger>
          <TabsTrigger value="prospective-clients">Prospective Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="question-banks" className="space-y-4">
          <QuestionBankManagement />
        </TabsContent>

        <TabsContent value="prospective-clients" className="space-y-4">
          <ProspectiveClientManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}