import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface Application {
  id: string;
  college_name: string;
  major: string;
  degree: string;
  category: string;
}

interface ApplicationsSectionProps {
  applications: Application[];
}

export default function ApplicationsSection({ applications }: ApplicationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <CardTitle>College Applications</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{app.college_name}</p>
                <p className="text-sm text-gray-600">{app.major} • {app.degree}</p>
              </div>
              <Badge className="bg-blue-500">{app.category}</Badge>
            </div>
          ))}
          {applications.length === 0 && (
            <p className="text-gray-500 text-center">No college applications yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}