
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { ArticleCategory } from "@/types/article";

interface MainNavProps {
  isAuthenticated: boolean;
  userId: string | null;
  onLogout: () => Promise<void>;
}

export default function MainNav({ isAuthenticated, userId, onLogout }: MainNavProps) {
  const navigate = useNavigate();
  
  const getDashboardLink = () => {
    return isAuthenticated && userId ? `/student-dashboard/${userId}` : "/login";
  };

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link to="/" className="font-bold text-xl">
              DreamPlanner
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                Free Resources
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/articles" className="w-full">
                    All Resources
                  </Link>
                </DropdownMenuItem>
                {categories?.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link 
                      to={`/articles?category=${category.id}`} 
                      className="w-full"
                    >
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button>
                    Dashboard
                  </Button>
                </Link>
                <Link to="/mock-interview">
                  <Button>
                    Mock Interview
                  </Button>
                </Link>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
