
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AssociateCounselorDialogProps {
  studentId: string;
  studentName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCounselorAssociated: () => void;
}

export function AssociateCounselorDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
  onCounselorAssociated,
}: AssociateCounselorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { data: counselors, isLoading: isCounselorsLoading } = useQuery({
    queryKey: ["counselors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_type", "counselor")
        .eq("is_verified", true)
        .order("full_name");

      if (error) {
        console.error("Error fetching counselors:", error);
        throw error;
      }

      return data || [];
    },
    enabled: open,
  });

  const { data: existingRelationship, isLoading: isRelationshipLoading } = useQuery({
    queryKey: ["existing-counselor-relationship", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:profiles!counselor_student_relationships_counselor_id_fkey(
            full_name,
            email
          )
        `)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching existing relationship:", error);
        throw error;
      }

      return data;
    },
    enabled: open && !!studentId,
  });

  const handleAssociateCounselor = async (counselorId: string) => {
    setIsLoading(true);
    try {
      // Check if there's an existing relationship to replace
      if (existingRelationship) {
        // Delete existing relationship
        const { error: deleteError } = await supabase
          .from("counselor_student_relationships")
          .delete()
          .eq("student_id", studentId)
          .eq("counselor_id", existingRelationship.counselor_id);

        if (deleteError) {
          console.error("Error removing existing relationship:", deleteError);
          toast.error("Failed to update counselor relationship");
          return;
        }
      }

      // Create new relationship
      const { error: insertError } = await supabase
        .from("counselor_student_relationships")
        .insert({
          counselor_id: counselorId,
          student_id: studentId,
          added_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (insertError) {
        console.error("Error creating relationship:", insertError);
        toast.error("Failed to associate counselor");
        return;
      }

      toast.success("Counselor successfully associated with student");
      onCounselorAssociated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in handleAssociateCounselor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Associate Counselor with Student</DialogTitle>
          <DialogDescription>
            {studentName ? `Select a counselor to associate with ${studentName}` : "Select a counselor to associate with this student"}
            {existingRelationship && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                <p className="font-semibold text-amber-800">
                  Current counselor: {existingRelationship.counselor.full_name}
                </p>
                <p className="text-amber-600">
                  Selecting a new counselor will replace this relationship.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {(isCounselorsLoading || isRelationshipLoading) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {counselors?.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No verified counselors available
                </div>
              ) : (
                counselors?.map((counselor) => (
                  <Card
                    key={counselor.id}
                    className={`cursor-pointer transition-colors ${
                      existingRelationship?.counselor_id === counselor.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{counselor.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {counselor.email}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssociateCounselor(counselor.id)}
                        disabled={isLoading}
                        variant={existingRelationship?.counselor_id === counselor.id ? "outline" : "default"}
                        size="sm"
                      >
                        {existingRelationship?.counselor_id === counselor.id
                          ? "Current"
                          : "Select"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
