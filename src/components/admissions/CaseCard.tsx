import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Calendar } from "lucide-react";
import { AdmissionCase } from "./types";

interface CaseCardProps {
  caseItem: AdmissionCase;
  onClick: () => void;
}

export default function CaseCard({ caseItem, onClick }: CaseCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
      onClick={onClick}
    >
      {caseItem.offer_image && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={caseItem.offer_image} 
            alt={`${caseItem.university} Offer`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{caseItem.university}</h3>
          <Badge variant="secondary" className="shrink-0">
            {caseItem.year}
          </Badge>
        </div>
        
        {caseItem.major && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="line-clamp-1">{caseItem.major}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{caseItem.country}</span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {caseItem.profile_style}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {caseItem.activities.slice(0, 2).map((activity, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {activity.length > 15 ? activity.slice(0, 15) + '...' : activity}
            </Badge>
          ))}
          {caseItem.activities.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{caseItem.activities.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
