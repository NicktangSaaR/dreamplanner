import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileSection from "@/components/college-planning/ProfileSection";

export default function Profile() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Student Profile</h1>
      <div className="bg-[#D3E4FD] p-4 rounded-lg">
        <ProfileSection />
      </div>
    </div>
  );
}