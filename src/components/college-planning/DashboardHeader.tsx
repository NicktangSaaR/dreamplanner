import { GraduationCap, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

export default function DashboardHeader() {
  const { profile } = useProfile();

  return (
    <div className="space-y-4 sm:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
          </div>
          <p className="text-lg text-gray-600">
            Hi, {profile?.full_name || "there"}
          </p>
        </div>
        <Link to="/profile" className="block mt-4 sm:mt-0">
          <Button variant="default" className="w-full sm:w-auto flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}