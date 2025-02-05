
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MainNav from "@/components/layout/MainNav";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ArticleList from "@/components/articles/ArticleList";

export default function Index() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    
    checkAuth();

    // Subscribe to auth state changes
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
          <ArticleList />
        </section>
      </main>
    </div>
  );
}
