import { GraduationCap, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

export default function DashboardHeader() {
  const { profile } = useProfile();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600">
          Hi, {profile?.full_name || "there"}
        </p>
      </div>
      <Link to="/profile">
        <Button variant="default" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          My Profile
        </Button>
      </Link>
    </div>
  );
}