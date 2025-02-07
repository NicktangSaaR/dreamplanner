import { Card, CardContent } from "@/components/ui/card";

interface StudentProfileProps {
  profile: {
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
    graduation_school: string | null;
    background_intro: string | null;
  };
}

export default function StudentProfile({ profile }: StudentProfileProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{profile.full_name}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Grade:</span> {profile.grade || "Not set"}</p>
              <p><span className="font-medium">School:</span> {profile.school || "Not set"}</p>
              {profile.interested_majors && profile.interested_majors.length > 0 && (
                <p><span className="font-medium">Interested Majors:</span> {profile.interested_majors.join(", ")}</p>
              )}
              {profile.graduation_school && (
                <p><span className="font-medium">Graduation School:</span> {profile.graduation_school}</p>
              )}
            </div>
          </div>
          <div>
            {profile.background_intro && (
              <div>
                <h3 className="font-medium mb-2">Background</h3>
                <p className="text-sm text-muted-foreground">{profile.background_intro}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}