
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectorProps {
  status: string;
  onChange: (value: string) => void;
}

export const StatusSelector = ({ status, onChange }: StatusSelectorProps) => {
  return (
    <Select 
      value={status} 
      onValueChange={onChange} 
      onOpenChange={(open) => {
        // Prevent card click when opening the select
        if (open) {
          event?.stopPropagation();
        }
      }}
    >
      <SelectTrigger 
        className="h-8 w-full text-xs" 
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Pre-9">Pre-9</SelectItem>
        <SelectItem value="G9">G9</SelectItem>
        <SelectItem value="G10">G10</SelectItem>
        <SelectItem value="G11">G11</SelectItem>
        <SelectItem value="College Bound">College Bound</SelectItem>
        <SelectItem value="Completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
};
