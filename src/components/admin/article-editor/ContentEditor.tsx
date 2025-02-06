
import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Label } from "@/components/ui/label";

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function ContentEditor({ content, onChange }: ContentEditorProps) {
  const handleEditorChange = (newContent: string) => {
    onChange(newContent);
  };

  return (
    <div>
      <Label htmlFor="content">内容</Label>
      <Editor
        id="content"
        apiKey="no-api-key" // You can get a free API key from TinyMCE
        value={content}
        onEditorChange={handleEditorChange}
        init={{
          height: 500,
          menubar: true,
          language: 'zh_CN',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
    </div>
  );
}
