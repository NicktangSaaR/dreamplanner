
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArticleEditorProps, ArticleData } from './article-editor/types';
import FormattingToolbar from './article-editor/FormattingToolbar';
import ContentEditor from './article-editor/ContentEditor';
import { loadArticle, saveArticle } from './article-editor/articleService';

export default function ArticleEditor({ articleId, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      if (articleId) {
        try {
          const data = await loadArticle(articleId);
          if (data) {
            setTitle(data.title);
            setContent(data.content);
          }
        } catch (error) {
          toast.error("Error loading article");
        }
      }
    };

    fetchArticle();
  }, [articleId]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const articleData: ArticleData = {
      title,
      content,
      updated_at: new Date().toISOString()
    };

    try {
      await saveArticle(articleId, articleData);
      toast.success(articleId ? "Article updated successfully" : "Article created successfully");
      if (onSave) {
        onSave(articleData);
      }
    } catch (error) {
      console.error("Error saving article:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error saving article");
      }
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

          <FormattingToolbar onExecCommand={execCommand} />
          <ContentEditor content={content} onChange={setContent} />

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
