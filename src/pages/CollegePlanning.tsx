import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExtracurricularSection from "@/components/college-planning/ExtracurricularSection";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import NotesSection from "@/components/college-planning/NotesSection";
import { BookOpen, Activity, StickyNote, GraduationCap } from "lucide-react";

export default function CollegePlanning() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academics
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Current GPA: 3.8</div>
            <p className="text-sm text-muted-foreground">8 courses this semester</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activities
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Activities</div>
            <p className="text-sm text-muted-foreground">12 hours/week total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Notes
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Notes</div>
            <p className="text-sm text-muted-foreground">Last updated today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="academics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="academics" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="extracurricular" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Extracurricular
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="academics">
          <AcademicsSection />
        </TabsContent>
        
        <TabsContent value="extracurricular">
          <ExtracurricularSection />
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}