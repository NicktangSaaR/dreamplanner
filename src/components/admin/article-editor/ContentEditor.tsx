
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
      // Decode HTML entities before setting innerHTML
      const decodedContent = new DOMParser().parseFromString(content, 'text/html').body.textContent || '';
      contentRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleContentChange = () => {
    if (contentRef.current) {
      const rawContent = contentRef.current.innerHTML;
      // Ensure we're getting clean HTML
      const cleanContent = new DOMParser()
        .parseFromString(rawContent, 'text/html')
        .body.innerHTML;
      onChange(cleanContent);
    }
  };

  return (
    <div>
      <Label htmlFor="content">内容</Label>
      <div
        ref={contentRef}
        contentEditable
        className="min-h-[200px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none"
        onInput={handleContentChange}
      />
    </div>
  );
}
