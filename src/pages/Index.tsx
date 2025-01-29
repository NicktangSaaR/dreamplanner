import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, User, Star } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

export default function Index() {
  const [features] = useState<Feature[]>([
    {
      title: "Track Your Progress",
      description: "Keep an eye on your college applications and deadlines.",
      icon: <Check className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Collaborate with Counselors",
      description: "Get guidance and support from experienced counselors.",
      icon: <User className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "Prepare for Success",
      description: "Access resources and tools to help you succeed.",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
    },
  ]);

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

  const getDashboardLink = () => {
    return isAuthenticated && userId ? `/student-dashboard/${userId}` : "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="font-bold text-xl">
              CollegePlan
            </Link>
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
                  <Button variant="outline" onClick={handleLogout}>
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

      <main className="container mx-auto px-4 pt-32">
        <section className="max-w-4xl mx-auto text-center">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Your Future Starts Here
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-bold">
            Plan Your College Journey
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Collaborate with counselors, track your progress, and prepare for success
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-white shadow-sm border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}