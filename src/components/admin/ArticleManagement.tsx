
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Article } from "@/types/article";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ArticleEditor from "./ArticleEditor";

export default function ArticleManagement() {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_categories (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }
      
      console.log("Fetched articles in admin:", data);
      
      // Transform the data to match the Article type
      const transformedData = data.map(article => ({
        ...article,
        category: article.article_categories,
      })) as Article[];
      
      return transformedData;
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      console.log("Toggling publish status:", { id, published });
      
      const { error } = await supabase
        .from('articles')
        .update({ 
          published,
          publish_date: published ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      // Also invalidate the public articles query to update the homepage
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success("文章状态已更新");
    },
    onError: (error) => {
      console.error("Error toggling publish status:", error);
      toast.error("更新失败：" + error.message);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      // Also invalidate the public articles query
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success("文章已删除");
    },
    onError: (error) => {
      toast.error("删除失败：" + error.message);
    },
  });

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setIsEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedArticle(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedArticle(null);
    // Invalidate both admin and public article queries
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    queryClient.invalidateQueries({ queryKey: ['published-articles'] });
  };

  if (isLoading) {
    return <div>Loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">文章管理</h2>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          新建文章
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>发布状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles?.map((article) => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.category?.name}</TableCell>
              <TableCell>
                <Switch
                  checked={article.published}
                  onCheckedChange={(checked) => 
                    togglePublishMutation.mutate({ 
                      id: article.id, 
                      published: checked 
                    })
                  }
                />
              </TableCell>
              <TableCell>
                {new Date(article.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(article)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm('确定要删除这篇文章吗？')) {
                      deleteArticleMutation.mutate(article.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="w-[90%] sm:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>{selectedArticle ? '编辑文章' : '新建文章'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ArticleEditor
              articleId={selectedArticle?.id}
              onSave={handleCloseEditor}
              onCancel={handleCloseEditor}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
