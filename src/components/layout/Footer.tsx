import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { t } = useLanguage();
  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  return <>
      <footer className="mt-auto border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-baseline gap-2">
              <Link to="/" className="font-serif text-xl font-bold text-pine">
                DreamPlanner
              </Link>
              <span className="text-xs text-muted-foreground">{t("footer.tagline")}</span>
            </div>
            <nav className="flex gap-8">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.about")}
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.contact")}
              </Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.rights")}
          </div>
        </div>
      </footer>
      
      {showScrollTop && <button onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-md transition-colors hover:bg-primary/90" aria-label={t("footer.backToTop")}>
          <ArrowUp className="h-5 w-5" />
        </button>}
    </>;
}