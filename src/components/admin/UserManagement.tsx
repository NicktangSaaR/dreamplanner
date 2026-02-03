
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { UserTable } from "./user-management/UserTable";
import { useUsersQuery } from "./user-management/useUsersQuery";
import { useUserMutations } from "./user-management/useUserMutations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssociateCounselorDialog } from "./user-management/AssociateCounselorDialog";
import AdminGoogleDriveAuth from "@/components/college-planning/google-drive/AdminGoogleDriveAuth";

interface EditableUser {
  id: string;
  full_name: string | null;
  email: string;
}

const UserManagement = () => {
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [editForm, setEditForm] = useState<{ 
    full_name: string; 
    email: string;
    password?: string;
  }>({
    full_name: "",
    email: "",
  });
  const [userToDelete, setUserToDelete] = useState<{id: string; name: string | null; type: string} | null>(null);
  const [studentForCounselor, setStudentForCounselor] = useState<{id: string; name: string | null} | null>(null);

  const { data: users = [], isLoading, refetch } = useUsersQuery();
  const { 
    deleteUserMutation,
    updateUserTypeMutation,
    updateUserDetailsMutation 
  } = useUserMutations();

  const handleDeleteUser = async (userId: string, userName: string | null, userType: string) => {
    setUserToDelete({
      id: userId,
      name: userName,
      type: userType === 'counselor' ? '辅导员' : '学生'
    });
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleUpdateUserType = async (userId: string, newType: string) => {
    await updateUserTypeMutation.mutateAsync({ userId, newType });
  };

  const startEditing = (user: any) => {
    setEditingUser({
      id: user.id,
      full_name: user.full_name,
      email: user.email || "",
    });
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ full_name: "", email: "" });
  };

  const saveUserDetails = async () => {
    if (!editingUser) return;

    const updates: { 
      full_name?: string; 
      email?: string;
      password?: string;
    } = {};

    if (editForm.full_name !== editingUser.full_name) {
      updates.full_name = editForm.full_name;
    }
    if (editForm.email !== editingUser.email) {
      updates.email = editForm.email;
    }
    if (editForm.password) {
      updates.password = editForm.password;
    }

    if (Object.keys(updates).length > 0) {
      await updateUserDetailsMutation.mutateAsync({
        userId: editingUser.id,
        data: updates,
      });
    }
    
    cancelEditing();
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Counselor account verified successfully");
      refetch();
    } catch (error) {
      console.error("Error verifying user:", error);
      toast.error("Failed to verify counselor account");
    }
  };

  const handleAssociateCounselor = (studentId: string, studentName: string | null) => {
    setStudentForCounselor({
      id: studentId,
      name: studentName,
    });
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Badge variant="secondary">
          {users.length} Users ({users.filter(u => u.user_type === 'counselor' && !u.is_verified).length} pending verification)
        </Badge>
      </div>

      {/* Google Drive Authorization Section */}
      <AdminGoogleDriveAuth />
      
      <UserTable
        users={users}
        editingUser={editingUser}
        editForm={editForm}
        onEdit={startEditing}
        onSave={saveUserDetails}
        onCancel={cancelEditing}
        onDelete={handleDeleteUser}
        onUpdateType={handleUpdateUserType}
        onFormChange={handleFormChange}
        onVerifyUser={handleVerifyUser}
        onAssociateCounselor={handleAssociateCounselor}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除{userToDelete?.type}{userToDelete?.name ? ` ${userToDelete.name}` : ''}吗？此操作将删除该用户的所有相关数据，且不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {studentForCounselor && (
        <AssociateCounselorDialog
          open={!!studentForCounselor}
          onOpenChange={(open) => {
            if (!open) setStudentForCounselor(null);
          }}
          studentId={studentForCounselor.id}
          studentName={studentForCounselor.name}
          onCounselorAssociated={refetch}
        />
      )}
    </div>
  );
};

export default UserManagement;
