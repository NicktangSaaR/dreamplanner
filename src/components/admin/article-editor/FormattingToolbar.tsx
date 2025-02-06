
import React from 'react';
import { Button } from "@/components/ui/button";

interface FormattingToolbarProps {
  onExecCommand: (command: string, value?: string) => void;
}

export default function FormattingToolbar({ onExecCommand }: FormattingToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onExecCommand('bold')}>
          Bold
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('italic')}>
          Italic
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('underline')}>
          Underline
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyLeft')}>
          Left
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyCenter')}>
          Center
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyRight')}>
          Right
        </Button>
      </div>
    </div>
  );
}
