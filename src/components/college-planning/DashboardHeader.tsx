import { GraduationCap, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
      </div>
      <Link to="/profile">
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          View Profile
        </Button>
      </Link>
    </div>
  );
}