import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { UserTable } from "./user-management/UserTable";

interface EditableUser {
  id: string;
  full_name: string | null;
  email: string;
}

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; email: string }>({
    full_name: "",
    email: "",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Fetching all users...");
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      console.log("Fetched profiles:", profiles);
      return profiles;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("用户已成功删除");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("删除用户失败");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, newType }: { userId: string; newType: string }) => {
      console.log("Updating user type:", userId, newType);
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("用户身份已更新");
    },
    onError: (error) => {
      console.error("Error updating user type:", error);
      toast.error("更新用户身份失败");
    },
  });

  const updateUserDetailsMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { full_name?: string; email?: string } }) => {
      console.log("Updating user details:", userId, data);
      
      const updates: Promise<any>[] = [];

      if (data.full_name) {
        updates.push(
          supabase
            .from('profiles')
            .update({ full_name: data.full_name })
            .eq('id', userId)
            .then(({ error }) => {
              if (error) throw error;
            })
        );
      }

      if (data.email) {
        const session = await supabase.auth.getSession();
        updates.push(
          new Promise<any>((resolve, reject) => {
            fetch('/functions/v1/update-user-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session?.access_token}`,
              },
              body: JSON.stringify({
                userId,
                newEmail: data.email,
              }),
            })
            .then(async (response) => {
              const result = await response.json();
              if (!response.ok) reject(new Error(result.error));
              resolve(result);
            })
            .catch(reject);
          })
        );
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast.success("用户信息已更新");
    },
    onError: (error) => {
      console.error("Error updating user details:", error);
      toast.error("更新用户信息失败");
    },
  });

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("确定要删除这个用户吗？此操作不可撤销。")) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const handleUpdateUserType = async (userId: string, newType: string) => {
    await updateUserMutation.mutateAsync({ userId, newType });
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

    const updates: { full_name?: string; email?: string } = {};
    if (editForm.full_name !== editingUser.full_name) {
      updates.full_name = editForm.full_name;
    }
    if (editForm.email !== editingUser.email) {
      updates.email = editForm.email;
    }

    if (Object.keys(updates).length > 0) {
      await updateUserDetailsMutation.mutateAsync({
        userId: editingUser.id,
        data: updates,
      });
    } else {
      cancelEditing();
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Badge variant="secondary">{users.length} Users</Badge>
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
      />
    </div>
  );
};

export default UserManagement;