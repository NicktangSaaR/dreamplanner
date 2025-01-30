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
import { MoreHorizontal, Trash2 } from "lucide-react";

const UserManagement = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Fetching all users...");
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }

      console.log("Fetched users:", profiles);
      return profiles;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      const { error } = await supabase.auth.admin.deleteUser(userId);
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

  const updateUserTypeMutation = useMutation({
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

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("确定要删除这个用户吗？此操作不可撤销。")) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const handleUpdateUserType = async (userId: string, newType: string) => {
    await updateUserTypeMutation.mutateAsync({ userId, newType });
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
              <TableCell>{user.full_name || 'N/A'}</TableCell>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;