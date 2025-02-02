import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();

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
        <AuthCard
          title="Welcome Back"
          subtitle="Please enter your login information"
          footer={
            <>
              <span className="text-muted-foreground">Don't have an account?</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </Button>
            </>
          }
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  );
}