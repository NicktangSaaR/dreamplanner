import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting login with:", { ...formData, password: "REDACTED" });

    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        console.error("Login error details:", error);
        
        // Handle email not confirmed error specifically
        if (error.message === "Email not confirmed") {
          toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please check your email for a verification link or contact support if you need help.",
          });
          return;
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "Please check your credentials and try again",
        });
        return;
      }

      if (session) {
        console.log("Login successful, session:", session);
        
        // Fetch user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch user profile",
          });
          return;
        }

        console.log("User profile:", profile);

        // If no profile exists, create one with default student type
        if (!profile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                user_type: 'student',
              }
            ]);

          if (insertError) {
            console.error("Error creating profile:", insertError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create user profile",
            });
            return;
          }

          navigate('/college-planning');
        } else {
          // Redirect based on user type
          console.log("Redirecting based on user type:", profile.user_type);
          if (profile.user_type === 'counselor') {
            navigate('/counselor-dashboard');
          } else {
            navigate('/college-planning');
          }
        }

        toast({
          title: "Success!",
          description: "You have been logged in successfully.",
        });
      }
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => navigate("/signup")}>
                Sign up
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}