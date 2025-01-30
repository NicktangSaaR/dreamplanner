import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import QuestionBankManagement from "@/components/admin/QuestionBankManagement";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="question-banks">Question Banks</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="question-banks" className="space-y-4">
          <QuestionBankManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};