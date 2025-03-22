
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CounselorCheckProps {
  studentId: string;
  onCounselorCheck: (counselorRelationship: any) => void;
}

export default function CounselorCheck({ studentId, onCounselorCheck }: CounselorCheckProps) {
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize the navigate function from useNavigate hook
  
  const { data: counselorRelationship, isSuccess: isCounselorCheckComplete } = useQuery({
    queryKey: ["counselor-relationship", studentId],
    queryFn: async () => {
      console.log("Fetching counselor relationship for student:", studentId);
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:profiles!counselor_student_relationships_counselor_profiles_fkey(
            full_name
          )
        `)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching counselor relationship:", error);
        return null;
      }
      console.log("Counselor relationship data:", data);
      return data;
    },
    enabled: !!studentId,
  });

  // Show toast for missing counselor relationship
  useEffect(() => {
    if (isCounselorCheckComplete) {
      onCounselorCheck(counselorRelationship);
      
      if (!counselorRelationship) {
        toast({
          variant: "destructive",
          title: "未关联辅导员",
          description: (
            <div className="flex flex-col gap-4">
              <p>您还未关联辅导员，这将影响您获取专业的指导</p>
              <Button 
                onClick={() => navigate('/student-profile')}
                variant="secondary"
                size="sm"
                className="w-full bg-white hover:bg-gray-100"
              >
                前往个人主页选择辅导员
              </Button>
            </div>
          ),
          duration: null,
        });
      }
    }
  }, [counselorRelationship, isCounselorCheckComplete, onCounselorCheck, toast, navigate]);

  return null;
}
