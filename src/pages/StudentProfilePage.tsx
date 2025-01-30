import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProfileSection from "@/components/college-planning/ProfileSection";
import SelectCounselorDialog from "@/components/college-planning/SelectCounselorDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  if (!profile || profile.user_type !== 'student') {
    navigate('/counselor-profile');
    return null;
  }

  const { data: relationship, refetch: refetchRelationship } = useQuery({
    queryKey: ["counselor-relationship", profile?.id],
    enabled: !!profile?.id,
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

      return data;
    },
  });

  const handleBack = () => {
    navigate(`/student-dashboard/${profile?.id}`);
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
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <div className="bg-[#D3E4FD] p-4 rounded-lg">
        <ProfileSection />
      </div>

      <div className="space-y-4">
        {relationship ? (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your current counselor is: <span className="font-medium text-foreground">{relationship.counselor?.full_name}</span>
            </p>
            <SelectCounselorDialog 
              studentId={profile.id} 
              onCounselorSelected={refetchRelationship}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">You haven't selected a counselor yet.</p>
            <SelectCounselorDialog 
              studentId={profile.id} 
              onCounselorSelected={refetchRelationship}
            />
          </div>
        )}
      </div>
    </div>
  );
}