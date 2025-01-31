import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Edit2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface EditableUser {
  id: string;
  full_name: string | null;
}

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string }>({
    full_name: "",
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
    mutationFn: async ({ userId, data }: { userId: string; data: { full_name?: string } }) => {
      console.log("Updating user details:", userId, data);
      
      if (data.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: data.full_name })
          .eq('id', userId);
        if (profileError) throw profileError;
      }
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
    });
    setEditForm({
      full_name: user.full_name || "",
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ full_name: "" });
  };

  const saveUserDetails = async () => {
    if (!editingUser) return;

    const updates: { full_name?: string } = {};
    if (editForm.full_name !== editingUser.full_name) {
      updates.full_name = editForm.full_name;
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

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Badge variant="secondary">{users.length} Users</Badge>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {editingUser?.id === user.id ? (
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  user.full_name || 'N/A'
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {user.user_type}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleUpdateUserType(user.id, 'student')}>
                      student
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateUserType(user.id, 'counselor')}>
                      counselor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateUserType(user.id, 'admin')}>
                      admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>{user.school || 'N/A'}</TableCell>
              <TableCell>
                {format(new Date(user.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {editingUser?.id === user.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={saveUserDetails}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;