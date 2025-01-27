import { Activity, BookOpen, Folder, ListTodo, StickyNote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import SharedFoldersSection from "./SharedFoldersSection";

interface DashboardTabsProps {
  onCoursesChange: (courses: any[]) => void;
  onActivitiesChange: (activities: any[]) => void;
  onNotesChange: (notes: any[]) => void;
}

export default function DashboardTabs({ 
  onCoursesChange, 
  onActivitiesChange, 
  onNotesChange 
}: DashboardTabsProps) {
  const navigate = useNavigate();

  return (
    <Tabs defaultValue="academics" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger 
          value="academics" 
          className="flex items-center gap-2 data-[state=active]:bg-[#F2FCE2]"
        >
          <BookOpen className="h-4 w-4" />
          Academics
        </TabsTrigger>
        <TabsTrigger 
          value="extracurricular" 
          className="flex items-center gap-2 data-[state=active]:bg-[#FEC6A1]"
        >
          <Activity className="h-4 w-4" />
          Extracurricular
        </TabsTrigger>
        <TabsTrigger 
          value="notes" 
          className="flex items-center gap-2 data-[state=active]:bg-[#E5DEFF]"
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </TabsTrigger>
        <TabsTrigger 
          value="todos" 
          className="flex items-center gap-2 data-[state=active]:bg-[#FFDEE2]"
        >
          <ListTodo className="h-4 w-4" />
          To-Dos
        </TabsTrigger>
        <TabsTrigger 
          value="shared-folders" 
          className="flex items-center gap-2 data-[state=active]:bg-[#D3E4FD]"
        >
          <Folder className="h-4 w-4" />
          Shared Folders
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="academics" className="bg-[#D3E4FD] p-4 rounded-lg">
        <Card>
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Track your academic progress, grades, and course history.
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/academics')}
            >
              View Full Academic Records
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="extracurricular" className="bg-[#D3E4FD] p-4 rounded-lg">
        <ExtracurricularSection onActivitiesChange={onActivitiesChange} />
      </TabsContent>
      
      <TabsContent value="notes" className="bg-[#D3E4FD] p-4 rounded-lg">
        <NotesSection onNotesChange={onNotesChange} />
      </TabsContent>

      <TabsContent value="todos" className="bg-[#D3E4FD] p-4 rounded-lg">
        <TodoSection />
      </TabsContent>

      <TabsContent value="shared-folders" className="bg-[#D3E4FD] p-4 rounded-lg">
        <SharedFoldersSection />
      </TabsContent>
    </Tabs>
  );
}