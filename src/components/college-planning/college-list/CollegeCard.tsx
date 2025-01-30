import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CollegeCardProps {
  id: string;
  collegeName: string;
  major: string;
  degree: string;
  category: string;
  collegeUrl: string;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  "Hard Reach": "bg-red-500",
  "Reach": "bg-orange-500",
  "Hard Target": "bg-yellow-500",
  "Target": "bg-green-500",
  "Safety": "bg-blue-500",
};

export default function CollegeCard({
  id,
  collegeName,
  major,
  degree,
  category,
  collegeUrl,
  onDelete,
}: CollegeCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{collegeName}</h3>
          <p className="text-sm text-muted-foreground">
            {major} • {degree}
          </p>
          <div className="flex gap-2 items-center mt-1">
            <Badge className={`${categoryColors[category]} text-white`}>
              {category}
            </Badge>
            <a
              href={collegeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              {collegeUrl}
            </a>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}