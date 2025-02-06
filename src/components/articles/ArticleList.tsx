
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory } from "@/types/article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ArticleListProps {
  categoryId?: string | null;
  limit?: number;
}

export default function ArticleList({ categoryId, limit }: ArticleListProps) {
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['published-articles', categoryId, limit],
    queryFn: async () => {
      console.log("Fetching articles with categoryId:", categoryId);
      
      let query = supabase
        .from('articles')
        .select(`
          *,
          article_categories (
            id,
            name
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      console.log("Fetched published articles:", data);
      return data as (Article & { article_categories: ArticleCategory })[];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading articles...</div>;
  }

  if (error) {
    console.error('Error loading articles:', error);
    return <div className="text-center text-red-500">Error loading articles.</div>;
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
