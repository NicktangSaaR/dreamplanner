import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";
import { Activity } from "../types/activity";

interface ActivityTableProps {
  activities: Activity[];
  editingActivity: Activity | null;
  onEditActivity: (activity: Activity) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingActivityChange: (field: string, value: string) => void;
}

export default function ActivityTable({
  activities,
  editingActivity,
  onEditActivity,
  onSaveEdit,
  onCancelEdit,
  onEditingActivityChange,
}: ActivityTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Activity</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Time Commitment</TableHead>
          <TableHead>Actions</TableHead>
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
              <TableCell>
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
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onEditActivity(activity)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
}