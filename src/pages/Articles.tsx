
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ArticleList from "@/components/articles/ArticleList";
import MainNav from "@/components/layout/MainNav";
import { useState, useEffect } from "react";

export default function Articles() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: category } = useQuery({
    queryKey: ['article-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const { data, error } = await supabase
        .from('article_categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MainNav 
        isAuthenticated={isAuthenticated} 
        userId={userId}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 pt-32">
        <h1 className="text-3xl font-bold mb-8">
          {categoryId ? (category?.name || 'Loading...') : "All Articles"}
        </h1>
        <ArticleList categoryId={categoryId} />
      </main>
    </div>
  );
}
