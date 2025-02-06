
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudentProfile from "./StudentProfile";
import { Profile } from "@/types/profile";

interface ProfileSectionProps {
  profile: Profile;
  studentId: string;
}

export default function ProfileSection({ profile, studentId }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <StudentProfile profile={profile} studentId={studentId} />
      </CardContent>
    </Card>
  );
}
