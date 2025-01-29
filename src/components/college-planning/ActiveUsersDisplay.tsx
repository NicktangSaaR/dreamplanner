import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActiveUser } from "@/hooks/usePresence";

interface ActiveUsersDisplayProps {
  activeUsers: ActiveUser[];
}

export default function ActiveUsersDisplay({ activeUsers }: ActiveUsersDisplayProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Active users:</span>
      <div className="flex gap-2">
        {activeUsers.map((user) => (
          <Badge
            key={user.id}
            variant={user.type === 'counselor' ? 'secondary' : 'outline'}
            className="flex items-center gap-1"
          >
            {user.name}
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </Badge>
        ))}
      </div>
    </div>
  );
}