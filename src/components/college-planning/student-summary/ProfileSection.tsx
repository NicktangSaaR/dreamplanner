
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileSectionProps {
  profile: {
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
  };
  studentId: string;
}

export default function ProfileSection({ profile, studentId }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><span className="font-medium">Name:</span> {profile.full_name}</p>
        <p><span className="font-medium">Grade:</span> {profile.grade || "Not set"}</p>
        <p><span className="font-medium">School:</span> {profile.school || "Not set"}</p>
        {profile.interested_majors && profile.interested_majors.length > 0 && (
          <p><span className="font-medium">Interested Majors:</span> {profile.interested_majors.join(", ")}</p>
        )}
      </CardContent>
    </Card>
  );
}
