import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArticleCategory } from "@/types/article";
import { GETOFFERS_URL } from "@/lib/siteLinks";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";

interface MainNavProps {
  isAuthenticated: boolean;
  userId: string | null;
  onLogout: () => Promise<void>;
}

function Brand() {
  const { t } = useLanguage();
  return (
    <Link to="/" className="flex items-baseline gap-2" aria-label={t("nav.brandHome")}>
      <span className="font-serif text-xl font-bold text-pine">DreamPlanner</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">Beta</span>
    </Link>
  );
}

export default function MainNav({ isAuthenticated, userId, onLogout }: MainNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();
  const dashboardLink = isAuthenticated && userId ? `/student-dashboard/${userId}` : "/login";

  const { data: categories } = useQuery({
    queryKey: ["article-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("article_categories").select("*").order("name");
      if (error) throw error;
      return data as ArticleCategory[];
    },
  });

  const linkClass = "text-sm text-muted-foreground transition-colors hover:text-primary";
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Brand />

            {/* Desktop links */}
            <div className="hidden items-center gap-6 md:flex">
              <HoverCard openDelay={0} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Link to="/articles" className={`flex items-center ${linkClass}`}>
                    {t("nav.resources")}
                    <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-48 p-1">
                  <div className="flex flex-col">
                    <Link to="/articles" className="rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                      {t("nav.allArticles")}
                    </Link>
                    {categories?.map((category) => (
                      <Link
                        key={category.id}
                        to={`/articles?category=${category.id}`}
                        className="rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </HoverCardContent>
              </HoverCard>
              {GETOFFERS_URL && (
                <a href={GETOFFERS_URL} className={linkClass}>
                  {t("nav.cases")}
                </a>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle />
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost">
                  <Link to="/mock-interview">{t("nav.mockInterview")}</Link>
                </Button>
                <Button asChild>
                  <Link to={dashboardLink}>{t("nav.dashboard")}</Link>
                </Button>
                <Button variant="outline" onClick={onLogout}>
                  {t("nav.logout")}
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t("nav.signup")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-serif text-pine">DreamPlanner</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                <Link to="/articles" onClick={closeMobile} className="rounded-sm px-2 py-2 hover:bg-accent">
                  {t("nav.allArticles")}
                </Link>
                {categories?.map((category) => (
                  <Link
                    key={category.id}
                    to={`/articles?category=${category.id}`}
                    onClick={closeMobile}
                    className="rounded-sm px-2 py-2 pl-5 text-sm text-muted-foreground hover:bg-accent"
                  >
                    {category.name}
                  </Link>
                ))}
                {GETOFFERS_URL && (
                  <a href={GETOFFERS_URL} className="rounded-sm px-2 py-2 hover:bg-accent">
                    {t("nav.cases")}
                  </a>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-2 border-t pt-6">
                {isAuthenticated ? (
                  <>
                    <Button asChild onClick={closeMobile}>
                      <Link to={dashboardLink}>{t("nav.dashboard")}</Link>
                    </Button>
                    <Button asChild variant="outline" onClick={closeMobile}>
                      <Link to="/mock-interview">{t("nav.mockInterview")}</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        closeMobile();
                        onLogout();
                      }}
                    >
                      {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild onClick={closeMobile}>
                      <Link to="/signup">{t("nav.signup")}</Link>
                    </Button>
                    <Button asChild variant="outline" onClick={closeMobile}>
                      <Link to="/login">{t("nav.login")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
