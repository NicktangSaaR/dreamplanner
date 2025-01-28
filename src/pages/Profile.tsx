import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileSection from "@/components/college-planning/ProfileSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import SelectCounselorDialog from "@/components/college-planning/SelectCounselorDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CounselorProfile {
  full_name: string | null;
}

interface CounselorRelationship {
  counselor_id: string;
  counselor: CounselorProfile;
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // Check if student already has a counselor
  const { data: relationship, refetch: refetchRelationship } = useQuery({
    queryKey: ["counselor-relationship", profile?.id],
    enabled: !!profile?.id && profile?.user_type === "student",
    queryFn: async () => {
      console.log("Fetching counselor relationship for student:", profile?.id);
      
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:profiles!counselor_student_relationships_counselor_profiles_fkey(
            full_name
          )
        `)
        .eq("student_id", profile?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching counselor relationship:", error);
        throw error;
      }

      console.log("Fetched counselor relationship:", data);
      return data as CounselorRelationship;
    },
  });

  const handleBack = () => {
    if (profile?.user_type === 'counselor') {
      navigate('/counselor-dashboard');
    } else {
      navigate('/college-planning');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Student Profile</h1>
      </div>

      <div className="bg-[#D3E4FD] p-4 rounded-lg">
        <ProfileSection />
      </div>

      {profile?.user_type === "student" && (
        <Card>
          <CardHeader>
            <CardTitle>Counselor Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {relationship ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Your current counselor is: <span className="font-medium text-foreground">{relationship.counselor?.full_name}</span>
                </p>
                <SelectCounselorDialog 
                  studentId={profile.id} 
                  onCounselorSelected={() => {
                    refetchRelationship();
                  }} 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">You haven't selected a counselor yet.</p>
                <SelectCounselorDialog 
                  studentId={profile.id} 
                  onCounselorSelected={() => {
                    refetchRelationship();
                  }} 
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}