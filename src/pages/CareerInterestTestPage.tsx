import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CareerInterestTest from "@/components/college-planning/CareerInterestTest";

export default function CareerInterestTestPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/student-profile")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Holland Career Interest Test</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <CareerInterestTest />
      </div>
    </div>
  );
}