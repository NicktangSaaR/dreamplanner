import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExtracurricularSection from "@/components/college-planning/ExtracurricularSection";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import NotesSection from "@/components/college-planning/NotesSection";

export default function CollegePlanning() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
      
      <Tabs defaultValue="academics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="extracurricular">Extracurricular</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
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