
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Edit2, Save, X, CheckCircle, XCircle, Trash2, UserPlus } from "lucide-react";
import { UserTypeSelect } from "./UserTypeSelect";
import { Badge } from "@/components/ui/badge";

interface EditableUser {
  id: string;
  full_name: string | null;
  email: string;
}

interface UserTableProps {
  users: any[];
  editingUser: EditableUser | null;
  editForm: { full_name: string; email: string; password?: string };
  onEdit: (user: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (userId: string, userName: string | null, userType: string) => void;
  onUpdateType: (userId: string, newType: string) => void;
  onFormChange: (field: string, value: string) => void;
  onVerifyUser?: (userId: string) => void;
  onAssociateCounselor?: (studentId: string, studentName: string | null) => void;
}

export const UserTable = ({
  users,
  editingUser,
  editForm,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdateType,
  onFormChange,
  onVerifyUser,
  onAssociateCounselor,
}: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
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
                  onChange={(e) => onFormChange('full_name', e.target.value)}
                  className="w-full"
                />
              ) : (
                user.full_name || 'N/A'
              )}
            </TableCell>
            <TableCell>
              {editingUser?.id === user.id ? (
                <Input
                  value={editForm.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  className="w-full"
                  type="email"
                />
              ) : (
                user.email || 'N/A'
              )}
            </TableCell>
            <TableCell>
              {editingUser?.id === user.id ? (
                <Input
                  value={editForm.password || ''}
                  onChange={(e) => onFormChange('password', e.target.value)}
                  className="w-full"
                  type="password"
                  placeholder="新密码"
                />
              ) : (
                '********'
              )}
            </TableCell>
            <TableCell>
              <UserTypeSelect
                currentType={user.user_type}
                userId={user.id}
                onUpdate={onUpdateType}
              />
            </TableCell>
            <TableCell>
              {user.user_type === 'counselor' && (
                <>
                  {user.is_verified ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-4 h-4 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-500">
                        <XCircle className="w-4 h-4 mr-1" /> Pending
                      </Badge>
                      {onVerifyUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerifyUser(user.id)}
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
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
                      onClick={onSave}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {/* Add Associate Counselor button for student users */}
                    {user.user_type === 'student' && onAssociateCounselor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAssociateCounselor(user.id, user.full_name)}
                        title="Associate counselor"
                      >
                        <UserPlus className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(user.id, user.full_name, user.user_type)}
                      className="text-destructive hover:text-destructive"
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
  );
};
