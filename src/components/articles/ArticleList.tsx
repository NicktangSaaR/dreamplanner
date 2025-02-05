
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory } from "@/types/article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ArticleList() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_categories(name)
        `)
        .eq('published', true)
        .order('publish_date', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Latest Articles</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles?.map((article) => (
          <Card key={article.id} className={cn(
            "overflow-hidden",
            "transition-all duration-200 hover:shadow-lg"
          )}>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
