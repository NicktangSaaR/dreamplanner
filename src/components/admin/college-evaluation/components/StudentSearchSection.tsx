
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  grade: string;
  school: string;
}

interface StudentSearchSectionProps {
  students: Student[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectStudent: (student: Student) => void;
}

export default function StudentSearchSection({
  students,
  isLoading,
  searchQuery,
  setSearchQuery,
  onSelectStudent
}: StudentSearchSectionProps) {
  const filteredStudents = students?.filter(student => student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return <Card>
      <CardHeader>
        <CardTitle>Student Evaluation Management</CardTitle>
        <CardDescription>Search for students and create US college admission evaluations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search student name..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="text-center py-4">Loading student data...</div> : <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? filteredStudents.map(student => <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name || "Unknown"}</TableCell>
                      <TableCell>{student.grade || "Unknown"}</TableCell>
                      <TableCell>{student.school || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => onSelectStudent(student)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Evaluation
                        </Button>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      {searchQuery ? "No matching students found" : "No student data available"}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
}
