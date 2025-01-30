import { useProfile } from "@/hooks/useProfile";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddStudentDialog from "./AddStudentDialog";
import InviteStudentDialog from "./InviteStudentDialog";
import StudentCard from "./StudentCard";
import SharedFolderCard from "./SharedFolderCard";
import SharedFolderDialog from "./SharedFolderDialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CounselorView() {
  const { profile } = useProfile();
  const { data: students, isLoading, refetch } = useCounselorStudents();
  const [isEditingFolder, setIsEditingFolder] = useState(false);

  console.log("Counselor profile:", profile);
  console.log("Students data:", students);

  if (!profile || profile.user_type !== 'counselor') {
    console.log("Not a counselor or no profile found");
    return null;
  }

  const handleSaveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from("shared_folders")
        .upsert({
          created_by: profile.id,
          ...data,
        });

      if (error) throw error;
      toast.success("Folder saved successfully");
      setIsEditingFolder(false);
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("Failed to save folder");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">My Students</h2>
        <div className="flex gap-2">
          <InviteStudentDialog counselorId={profile.id} />
          <AddStudentDialog counselorId={profile.id} onStudentAdded={refetch} />
        </div>
      </div>

      <SharedFolderCard
        folder={null}
        onEditClick={() => setIsEditingFolder(true)}
      />

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 gap-4">
            {students?.map((relationship) => (
              <StudentCard
                key={relationship.student_id}
                student={{
                  id: relationship.student_id,
                  ...relationship.students!
                }}
              />
            ))}
            {students?.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No students found. Add or invite students to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}

      <SharedFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        onSubmit={handleSaveFolder}
      />
    </div>
  );
}