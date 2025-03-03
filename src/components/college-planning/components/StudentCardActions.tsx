
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { StatusSelector } from "./StatusSelector";

interface StudentCardActionsProps {
  isPrimaryCounselor: boolean;
  status: string;
  onStatusChange: (status: string) => void;
  onAddCollaborator: (e: React.MouseEvent) => void;
  onRemoveCollaborator: (e: React.MouseEvent) => void;
  onViewSummary: (e: React.MouseEvent) => void;
}

export const StudentCardActions = ({
  isPrimaryCounselor,
  status,
  onStatusChange,
  onAddCollaborator,
  onRemoveCollaborator,
  onViewSummary,
}: StudentCardActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      {isPrimaryCounselor && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCollaborator}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemoveCollaborator}
            className="whitespace-nowrap text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
          <StatusSelector 
            status={status}
            onChange={onStatusChange}
          />
        </>
      )}
      <Button 
        onClick={onViewSummary}
        size="sm"
        className="whitespace-nowrap"
      >
        View
      </Button>
    </div>
  );
};
