
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
      contentRef.current.innerHTML = content;
    }
  }, [content]);

  const handleContentChange = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  return (
    <div>
      <Label htmlFor="content">Content</Label>
      <div
        ref={contentRef}
        contentEditable
        className="min-h-[200px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none"
        onInput={handleContentChange}
      />
    </div>
  );
}
