import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface SelectCounselorDialogProps {
  studentId: string;
  onCounselorSelected: () => void;
}

export default function SelectCounselorDialog({ studentId, onCounselorSelected }: SelectCounselorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: counselors, isLoading: isCounselorsLoading } = useQuery({
    queryKey: ["counselors"],
    queryFn: async () => {
      console.log("Fetching counselors");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("user_type", "counselor");

      if (error) {
        console.error("Error fetching counselors:", error);
        throw error;
      }

      console.log("Fetched counselors:", data);
      return data;
    },
  });

  const handleSelectCounselor = async (counselorId: string) => {
    setIsLoading(true);
    try {
      console.log("Creating relationship with counselor:", counselorId);
      
      const { error: relationshipError } = await supabase
        .from("counselor_student_relationships")
        .insert({
          counselor_id: counselorId,
          student_id: studentId,
        });

      if (relationshipError) {
        console.error("Error creating relationship:", relationshipError);
        toast.error("Failed to select counselor");
        return;
      }

      toast.success("Counselor selected successfully");
      onCounselorSelected();
      setIsOpen(false);
    } catch (error) {
      console.error("Error in handleSelectCounselor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Select Counselor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Counselor</DialogTitle>
        </DialogHeader>
        {isCounselorsLoading ? (
          <div>Loading counselors...</div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {counselors?.map((counselor) => (
                <Card
                  key={counselor.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => !isLoading && handleSelectCounselor(counselor.id)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{counselor.full_name}</div>
                  </CardContent>
                </Card>
              ))}
              {counselors?.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No counselors found
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}