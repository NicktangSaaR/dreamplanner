import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MainNav from "@/components/layout/MainNav";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ArticleList from "@/components/articles/ArticleList";
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Article, ArticleCategory } from "@/types/article";
import { cn } from "@/lib/utils";

// Category color mapping
const categoryColors: { [key: string]: string } = {
  "学术资源": "bg-[#F2FCE2]", // Soft Green
  "升学指导": "bg-[#E5DEFF]", // Soft Purple
  "职业发展": "bg-[#FEC6A1]", // Soft Orange
  "校园生活": "bg-[#D3E4FD]", // Soft Blue
  "留学申请": "bg-[#FFDEE2]", // Soft Pink
  "default": "bg-[#F1F0FB]", // Soft Gray
};

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MainNav 
        isAuthenticated={isAuthenticated} 
        userId={userId}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 pt-32">
        <Hero />
        <Features />
        <section className="mt-24 mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Latest Articles</h2>
            <Link to="/articles" className="text-primary hover:underline">
              View all articles →
            </Link>
          </div>
          <Carousel 
            className="w-full max-w-5xl mx-auto"
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              startIndex: 0,
              slidesToScroll: 3
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: false,
              }),
            ]}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {articles?.map((article) => (
                <CarouselItem key={article.id} className="pl-2 md:pl-4 basis-1/3">
                  <Card className={cn(
                    "overflow-hidden cursor-pointer h-full",
                    "transition-all duration-200 hover:shadow-lg",
                    categoryColors[article.article_categories?.name || "default"]
                  )}>
                    <Link to={`/articles/${article.id}`}>
                      <CardHeader>
                        <CardTitle className="line-clamp-2 h-12">{article.title}</CardTitle>
                        <div className="space-y-1.5">
                          {article.article_categories && (
                            <div className="text-sm text-muted-foreground font-medium">
                              {article.article_categories.name}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>
    </div>
  );
}
