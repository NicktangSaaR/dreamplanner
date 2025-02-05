
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory } from "@/types/article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ArticleListProps {
  categoryId?: string | null;
}

export default function ArticleList({ categoryId }: ArticleListProps) {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['published-articles', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(`
          *,
          article_categories (
            id,
            name
          )
        `)
        .eq('published', true);
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }
      return data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading articles...</div>;
  }

  if (!articles?.length) {
    return <div className="text-center text-muted-foreground">No articles found.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Card key={article.id} className={cn(
          "overflow-hidden cursor-pointer",
          "transition-all duration-200 hover:shadow-lg"
        )}>
          <Link to={`/articles/${article.id}`}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{article.title}</CardTitle>
              {article.article_categories && (
                <div className="text-sm text-muted-foreground">
                  {article.article_categories.name}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-muted-foreground">
                {article.content}
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {new Date(article.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
