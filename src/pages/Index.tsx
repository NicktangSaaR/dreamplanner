import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MainNav from "@/components/layout/MainNav";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { Article, ArticleCategory } from "@/types/article";
import { GETOFFERS_URL } from "@/lib/siteLinks";
import { Button } from "@/components/ui/button";



export default function Index() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: articles } = useQuery({
    queryKey: ['published-articles', null, 5],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_categories (
            id,
            name
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      return data as (Article & { article_categories: ArticleCategory })[];
    }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
        toast.error("Error logging out");
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        toast.success("Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav 
        isAuthenticated={isAuthenticated} 
        userId={userId}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 pb-24 pt-28 sm:pt-36">
        <Hero />
        <Features />
        {GETOFFERS_URL && (
          <section className="mt-28 rounded-md bg-pine px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h2 className="font-serif text-2xl font-semibold sm:text-3xl">看看往届学生的录取案例</h2>
                <p className="mt-3 text-white/80">按学校、专业和背景筛选，了解不同路径的申请准备。</p>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0">
                <a href={GETOFFERS_URL}>查看录取案例</a>
              </Button>
            </div>
          </section>
        )}

        {articles && articles.length > 0 && (
          <section className="mt-28" aria-labelledby="articles-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="articles-heading" className="font-serif text-2xl font-semibold text-pine sm:text-3xl">
                最新文章
              </h2>
              <Link to="/articles" className="shrink-0 text-sm font-medium text-primary hover:underline">
                全部文章
              </Link>
            </div>
            <Carousel
              className="mt-8"
              opts={{ align: "start", loop: articles.length > 3 }}
              plugins={[Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })]}
            >
              <CarouselContent className="-ml-4">
                {articles.map((article) => (
                  <CarouselItem key={article.id} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
                    <Link
                      to={`/articles/${article.id}`}
                      className="group flex h-full flex-col rounded-md border bg-card p-5 transition-colors hover:border-primary"
                    >
                      {article.article_categories && (
                        <span className="text-sm font-medium text-primary">{article.article_categories.name}</span>
                      )}
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-pine group-hover:text-primary">
                        {article.title}
                      </h3>
                      <time className="mt-auto pt-4 text-sm text-muted-foreground" dateTime={article.created_at}>
                        {new Date(article.created_at).toLocaleDateString("zh-CN")}
                      </time>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-6 flex justify-end gap-2">
                <CarouselPrevious className="static translate-y-0" aria-label="上一篇" />
                <CarouselNext className="static translate-y-0" aria-label="下一篇" />
              </div>
            </Carousel>
          </section>
        )}
      </main>
    </div>
  );
}
