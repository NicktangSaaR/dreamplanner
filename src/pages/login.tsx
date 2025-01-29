import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with email:", email);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        
        // Handle specific error cases
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (signInError.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before logging in.");
        } else {
          toast.error(signInError.message);
        }
        return;
      }

      // Get user profile to check user type
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Failed to get user information");
        return;
      }

      console.log("Fetching user profile for:", user.id);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type, is_admin")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to get user profile");
        return;
      }

      console.log("User profile:", profile);

      // Redirect based on user type
      if (profile.is_admin) {
        console.log("Redirecting to admin dashboard");
        navigate("/admin-dashboard");
      } else if (profile.user_type === "counselor") {
        console.log("Redirecting to counselor dashboard");
        navigate("/counselor-dashboard");
      } else if (profile.user_type === "student") {
        console.log("Redirecting to student dashboard");
        navigate(`/student-dashboard/${user.id}`);
      } else {
        console.log("Redirecting to college planning");
        navigate("/college-planning");
      }

      toast.success("Successfully logged in!");
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate("/")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Enter your credentials to sign in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}