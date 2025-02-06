
import React, { useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function ContentEditor({ content, onChange }: ContentEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Simply set the HTML content directly
      contentRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleContentChange = () => {
    if (contentRef.current) {
      // Get the HTML content and clean it
      const cleanContent = contentRef.current.innerHTML;
      onChange(cleanContent);
    }
  };

  return (
    <div>
      <Label htmlFor="content">内容</Label>
      <div
        ref={contentRef}
        contentEditable
        className="min-h-[200px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none whitespace-pre-wrap"
        onInput={handleContentChange}
        suppressContentEditableWarning
      />
    </div>
  );
}
