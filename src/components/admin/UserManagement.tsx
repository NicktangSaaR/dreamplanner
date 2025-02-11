
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { UserTable } from "./user-management/UserTable";
import { useUsersQuery } from "./user-management/useUsersQuery";
import { useUserMutations } from "./user-management/useUserMutations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const { data: users = [], isLoading, refetch } = useUsersQuery();
  const { 
    deleteUserMutation,
    updateUserTypeMutation,
    updateUserDetailsMutation 
  } = useUserMutations();

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("确定要删除这个用户吗？此操作不可撤销。")) {
      await deleteUserMutation.mutateAsync(userId);
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
      />
    </div>
  );
};

export default UserManagement;
