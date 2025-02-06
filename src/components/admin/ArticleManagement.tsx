
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Article } from "@/types/article";
import ArticleTable from "./article-management/ArticleTable";
import ArticleHeader from "./article-management/ArticleHeader";
import ArticleEditorSheet from "./article-management/ArticleEditorSheet";

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
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    queryClient.invalidateQueries({ queryKey: ['published-articles'] });
  };

  if (isLoading) {
    return <div>Loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      <ArticleHeader onNew={handleNew} />
      
      <ArticleTable
        articles={articles || []}
        onEdit={handleEdit}
        onDelete={(id) => deleteArticleMutation.mutate(id)}
        onTogglePublish={(id, published) => 
          togglePublishMutation.mutate({ id, published })
        }
      />

      <ArticleEditorSheet
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        selectedArticle={selectedArticle}
        onClose={handleCloseEditor}
      />
    </div>
  );
}
