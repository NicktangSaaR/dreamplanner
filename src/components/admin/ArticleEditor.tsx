
import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ArticleEditorProps {
  articleId?: string;
  onSave?: (article: any) => void;
  onCancel?: () => void;
}

export default function ArticleEditor({ articleId, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadArticle = async () => {
      if (articleId) {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) {
          toast.error("Error loading article");
          return;
        }

        if (data) {
          setTitle(data.title);
          setContent(data.content);
          if (contentRef.current) {
            contentRef.current.innerHTML = data.content;
          }
        }
      }
    };

    loadArticle();
  }, [articleId]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      contentRef.current.focus();
      setContent(contentRef.current.innerHTML);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const articleData = {
      title,
      content: contentRef.current?.innerHTML || content,
      updated_at: new Date().toISOString()
    };

    if (articleId) {
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', articleId);

      if (error) {
        toast.error("Error updating article");
        return;
      }
      toast.success("Article updated successfully");
    } else {
      const { error } = await supabase
        .from('articles')
        .insert([{ ...articleData, created_at: new Date().toISOString() }]);

      if (error) {
        toast.error("Error creating article");
        return;
      }
      toast.success("Article created successfully");
    }

    if (onSave) {
      onSave(articleData);
    }
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
            />
          </div>

          <div className="space-y-2">
            <Label>Formatting</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => execCommand('bold')}>
                Bold
              </Button>
              <Button type="button" variant="outline" onClick={() => execCommand('italic')}>
                Italic
              </Button>
              <Button type="button" variant="outline" onClick={() => execCommand('underline')}>
                Underline
              </Button>
              <Button type="button" variant="outline" onClick={() => execCommand('justifyLeft')}>
                Left
              </Button>
              <Button type="button" variant="outline" onClick={() => execCommand('justifyCenter')}>
                Center
              </Button>
              <Button type="button" variant="outline" onClick={() => execCommand('justifyRight')}>
                Right
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <div
              ref={contentRef}
              contentEditable
              className="min-h-[200px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none"
              onInput={handleContentChange}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {articleId ? 'Update' : 'Create'} Article
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
