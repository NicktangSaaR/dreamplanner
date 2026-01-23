import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, MapPin, Calendar, BookOpen, Award } from "lucide-react";
import { AdmissionCase } from "./types";

interface CaseDetailDialogProps {
  caseItem: AdmissionCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CaseDetailDialog({ caseItem, open, onOpenChange }: CaseDetailDialogProps) {
  if (!caseItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{caseItem.university}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {caseItem.offer_image && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={caseItem.offer_image} 
                alt={`${caseItem.university} Offer`}
                className="w-full h-auto"
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            <Badge className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {caseItem.year}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {caseItem.country}
            </Badge>
            {caseItem.major && (
              <Badge variant="outline" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {caseItem.major}
              </Badge>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" />
                学生画像
              </h4>
              <p className="text-muted-foreground">{caseItem.profile_style}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                学术背景
              </h4>
              <p className="text-muted-foreground">{caseItem.academic_background}</p>
            </div>
          </div>
          
          {caseItem.activities.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">课外活动</h4>
                <div className="space-y-2">
                  {caseItem.activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{idx + 1}.</span>
                      <span className="text-muted-foreground">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {caseItem.courses.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">相关课程/项目</h4>
                <div className="flex flex-wrap gap-2">
                  {caseItem.courses.map((course, idx) => (
                    <Badge key={idx} variant="secondary">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
