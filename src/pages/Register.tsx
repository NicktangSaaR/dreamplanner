import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Register() {
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
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {/* Registration form will be implemented later */}
        <p className="text-muted-foreground">Registration functionality coming soon</p>
      </div>
    </div>
  );
}