import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { Activity } from "../types/activity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActivityTableProps {
  activities: Activity[];
  editingActivity: Activity | null;
  onEditActivity: (activity: Activity) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingActivityChange: (field: string, value: string) => void;
  onDeleteActivity: (activityId: string) => void;
}

export default function ActivityTable({
  activities,
  editingActivity,
  onEditActivity,
  onSaveEdit,
  onCancelEdit,
  onEditingActivityChange,
  onDeleteActivity,
}: ActivityTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>活动名称</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>时间投入</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) =>
          editingActivity?.id === activity.id ? (
            <TableRow key={activity.id}>
              <TableCell>
                <Input
                  value={editingActivity.name}
                  onChange={(e) => onEditingActivityChange("name", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={editingActivity.role}
                  onChange={(e) => onEditingActivityChange("role", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Textarea
                  value={editingActivity.description}
                  onChange={(e) => onEditingActivityChange("description", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={editingActivity.time_commitment}
                  onChange={(e) => onEditingActivityChange("time_commitment", e.target.value)}
                />
              </TableCell>
              <TableCell className="space-x-2">
                <Button variant="ghost" size="icon" onClick={onSaveEdit}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow key={activity.id}>
              <TableCell>{activity.name}</TableCell>
              <TableCell>{activity.role}</TableCell>
              <TableCell>{activity.description}</TableCell>
              <TableCell>{activity.time_commitment}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="ghost" size="icon" onClick={() => onEditActivity(activity)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要删除这个活动吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteActivity(activity.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
}