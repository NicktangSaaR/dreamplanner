
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArticleEditorProps, ArticleData } from './article-editor/types';
import FormattingToolbar from './article-editor/FormattingToolbar';
import ContentEditor from './article-editor/ContentEditor';
import { loadArticle, saveArticle } from './article-editor/articleService';

export default function ArticleEditor({ articleId, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ['article-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const fetchArticle = async () => {
      if (articleId) {
        try {
          const data = await loadArticle(articleId);
          if (data) {
            setTitle(data.title);
            setContent(data.content);
            setCategoryId(data.category_id || "");
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
      category_id: categoryId || undefined,
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
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
            />
          </div>

          <div>
            <Label htmlFor="category">分类</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无分类</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormattingToolbar onExecCommand={execCommand} />
          <ContentEditor content={content} onChange={setContent} />

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
            <Button type="submit">
              {articleId ? '更新' : '创建'}文章
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
