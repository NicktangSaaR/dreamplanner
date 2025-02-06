
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
      // 直接设置文本内容
      contentRef.current.textContent = content || '';
    }
  }, [content]);

  const handleContentChange = () => {
    if (contentRef.current) {
      // 获取纯文本内容
      const newContent = contentRef.current.textContent || '';
      onChange(newContent);
    }
  };

  return (
    <div>
      <Label htmlFor="content">内容</Label>
      <div
        ref={contentRef}
        contentEditable
        className="min-h-[200px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none whitespace-pre-wrap break-words"
        onInput={handleContentChange}
        suppressContentEditableWarning
        dir="ltr"
      />
    </div>
  );
}
