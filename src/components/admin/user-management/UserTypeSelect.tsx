import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserTypeSelectProps {
  currentType: string;
  userId: string;
  onUpdate: (userId: string, newType: string) => void;
}

export const UserTypeSelect = ({
  currentType,
  userId,
  onUpdate,
}: UserTypeSelectProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {currentType}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onUpdate(userId, 'student')}>
          student
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(userId, 'counselor')}>
          counselor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(userId, 'admin')}>
          admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};