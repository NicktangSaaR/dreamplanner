
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory } from "@/types/article";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ArticleEditorProps {
  article?: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ArticleFormData {
  title: string;
  content: string;
  category_id: string;
}

export default function ArticleEditor({ article, isOpen, onClose }: ArticleEditorProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<ArticleFormData>({
    defaultValues: {
      title: article?.title || "",
      content: article?.content || "",
      category_id: article?.category_id || ""
    }
  });

  // Reset form when article changes
  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        content: article.content,
        category_id: article.category_id || ""
      });
    } else {
      reset({
        title: "",
        content: "",
        category_id: ""
      });
    }
  }, [article, reset]);

  const { data: categories } = useQuery({
    queryKey: ['article-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ArticleCategory[];
    }
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const { error } = await supabase
        .from('articles')
        .upsert({
          id: article?.id,
          ...data,
          author_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(article ? "文章已更新" : "文章已创建");
      onClose();
    },
    onError: (error) => {
      console.error("Error saving article:", error);
      toast.error("保存失败：" + error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    saveArticleMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{article ? "编辑文章" : "新建文章"}</DialogTitle>
          <DialogDescription>
            在这里编辑文章内容。填写完成后点击保存。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              {...register("title", { required: "标题不能为空" })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Select
              onValueChange={(value) => setValue("category_id", value)}
              defaultValue={article?.category_id || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              rows={10}
              {...register("content", { required: "内容不能为空" })}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
