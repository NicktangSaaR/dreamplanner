import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, BrainCircuit } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import { ArticleCategory } from "@/types/article";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface MainNavProps {
  isAuthenticated: boolean;
  userId: string | null;
  onLogout: () => Promise<void>;
}
export default function MainNav({
  isAuthenticated,
  userId,
  onLogout
}: MainNavProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const getDashboardLink = () => {
    return isAuthenticated && userId ? `/student-dashboard/${userId}` : "/login";
  };
  const {
    data: categories
  } = useQuery({
    queryKey: ['article-categories'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('article_categories').select('*').order('name');
      if (error) throw error;
      return data as ArticleCategory[];
    }
  });
  const ResourcesMenu = () => {
    if (isMobile) {
      return <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            Free Resources
            <ChevronDown className="ml-1 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white">
            <DropdownMenuItem asChild>
              <Link to="/articles" className="w-full">
                All Articles
              </Link>
            </DropdownMenuItem>
            {categories?.map(category => <DropdownMenuItem key={category.id} asChild>
                <Link to={`/articles?category=${category.id}`} className="w-full">
                  {category.name}
                </Link>
              </DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>;
    }
    return <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          Free Resources
          <ChevronDown className="ml-1 h-4 w-4" />
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-48 bg-white shadow-lg border rounded-md">
          <div className="flex flex-col space-y-1">
            <Link to="/articles" className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-md">
              All Articles
            </Link>
            {categories?.map(category => <Link key={category.id} to={`/articles?category=${category.id}`} className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-md">
                {category.name}
              </Link>)}
          </div>
        </HoverCardContent>
      </HoverCard>;
  };
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-baseline gap-2">
              <Link to="/" className="font-bold text-xl">
                DreamPlanner
              </Link>
              <span className="text-xs text-muted-foreground">Beta v1.5</span>
            </div>
            <ResourcesMenu />
            <Link to="/admissions" className="text-muted-foreground hover:text-primary transition-colors">
              录取案例
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? <>
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
                <Link to="/activity-brainstorming">
                  <Button variant="outline" className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    活动构思器
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded-full">Beta</span>
                  </Button>
                </Link>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </> : <>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>}
          </div>
        </div>
      </div>
    </nav>;
}