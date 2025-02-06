
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AddCounselorDialog from "./AddCounselorDialog";

interface StudentProfileProps {
  profile: {
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
    graduation_school: string | null;
    background_intro: string | null;
  };
  studentId: string;
}

interface Counselor {
  id: string;
  full_name: string | null;
  is_primary: boolean;
}

export default function StudentProfile({ profile, studentId }: StudentProfileProps) {
  const { data: counselors, refetch: refetchCounselors } = useQuery({
    queryKey: ["student-counselors", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          is_primary,
          counselor:profiles!counselor_student_relationships_counselor_profiles_fkey(
            id,
            full_name
          )
        `)
        .eq("student_id", studentId)
        .order("is_primary", { ascending: false });

      if (error) {
        console.error("Error fetching counselors:", error);
        throw error;
      }

      return data.map(row => ({
        id: row.counselor.id,
        full_name: row.counselor.full_name,
        is_primary: row.is_primary
      })) as Counselor[];
    },
    enabled: !!studentId
  });

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

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Counselors</h3>
                <AddCounselorDialog 
                  studentId={studentId}
                  onCounselorAdded={refetchCounselors}
                />
              </div>
              <div className="space-y-1">
                {counselors?.map((counselor) => (
                  <div key={counselor.id} className="flex items-center text-sm">
                    <span>{counselor.full_name}</span>
                    {counselor.is_primary && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
