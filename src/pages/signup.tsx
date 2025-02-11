import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    userType: "student" as "student" | "counselor"
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting signup with:", { ...formData, password: "REDACTED" });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        
        // Handle user already exists error specifically
        if (error.message.includes("User already registered")) {
          toast({
            variant: "destructive",
            title: "Account Already Exists",
            description: "This email is already registered. Please log in instead.",
          });
          // Automatically redirect to login after a short delay
          setTimeout(() => navigate("/login"), 2000);
          return;
        }
        
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message,
        });
        return;
      }

      console.log("Signup successful:", data);

      // Show different messages based on user type
      if (formData.userType === 'counselor') {
        toast({
          title: "Registration Pending",
          description: "Your counselor account has been created. Please wait for admin verification before logging in.",
        });
      } else {
        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      }
      
      navigate("/login");
    } catch (error) {
      console.error("Unexpected error:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Link 
        to="/" 
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-900"
      >
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Sign up to get started with our platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              />
            </div>

            <div className="space-y-2">
              <Label>I am a</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value as "student" | "counselor" })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="counselor" id="counselor" />
                  <Label htmlFor="counselor">Counselor</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
                Log in
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
