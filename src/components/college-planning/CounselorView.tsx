import { useProfile } from "@/hooks/useProfile";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus, GraduationCap, School, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  user_type: string;
  created_at: string;
  updated_at: string;
  social_media: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  } | null;
  personal_website: string | null;
}

export default function CounselorView() {
  const { profile } = useProfile();
  const { data: students, isLoading, refetch } = useCounselorStudents();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  console.log("Counselor profile:", profile);
  console.log("Students data:", students);

  if (!profile || profile.user_type !== 'counselor') {
    console.log("Not a counselor or no profile found");
    return null;
  }

  const handleAddStudent = async () => {
    try {
      setIsAdding(true);
      console.log("Adding student with email:", email);

      // First, get the user profile by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.from('auth').select('id').eq('email', email).single()).data?.id)
        .single();

      if (profileError || !profiles) {
        console.error("Error finding student profile:", profileError);
        toast({
          title: "Error",
          description: "Student not found. Make sure they have registered first.",
          variant: "destructive",
        });
        return;
      }

      // Add the counselor-student relationship
      const { error: relationshipError } = await supabase
        .from('counselor_student_relationships')
        .insert({
          counselor_id: profile.id,
          student_id: profiles.id,
        });

      if (relationshipError) {
        console.error("Error creating relationship:", relationshipError);
        toast({
          title: "Error",
          description: "Failed to add student. They might already be assigned to you.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Student added successfully!",
      });
      
      refetch();
      setEmail("");
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Students</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Student Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddStudent} 
                disabled={isAdding || !email}
                className="w-full"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Student"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 gap-4">
            {students?.map((relationship) => (
              <Card 
                key={relationship.student_id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/student/${relationship.student_id}/college-planning`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{relationship.students?.full_name}</span>
                    <Button variant="ghost">View Dashboard</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Grade: {relationship.students?.grade || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        School: {relationship.students?.school || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Interested in: {relationship.students?.interested_majors?.join(', ') || 'Not set'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {students?.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No students found. Add students to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}