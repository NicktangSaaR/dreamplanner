
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";
import ArticleTable from "./article-management/ArticleTable";
import ArticleHeader from "./article-management/ArticleHeader";
import ArticleEditorSheet from "./article-management/ArticleEditorSheet";
import { useTogglePublishMutation } from "./article-management/hooks/useTogglePublishMutation";
import { useDeleteArticleMutation } from "./article-management/hooks/useDeleteArticleMutation";

export default function ArticleManagement() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const togglePublishMutation = useTogglePublishMutation();
  const deleteArticleMutation = useDeleteArticleMutation();

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
    // Invalidate and refetch articles after closing editor
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
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

