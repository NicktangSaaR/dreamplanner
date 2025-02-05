
import { ExportButtons } from "../ExportButtons";
import { AddCollegeDialog } from "../AddCollegeDialog";
import { CollegeFormValues } from "../collegeSchema";
import { CollegeApplication, StudentProfile } from "../types";

interface CollegeListHeaderProps {
  applications: CollegeApplication[];
  profile: StudentProfile | null;
  onSubmit: (values: CollegeFormValues, applicationId?: string) => Promise<void>;
  editApplication: CollegeApplication | null;
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditReset: () => void;
}

export function CollegeListHeader({
  applications,
  profile,
  onSubmit,
  editApplication,
  isDialogOpen,
  onOpenChange,
  onEditReset
}: CollegeListHeaderProps) {
  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">College List</h2>
        <div className="flex items-center gap-2">
          <ExportButtons 
            applications={applications} 
            profile={profile}
          />
          <AddCollegeDialog 
            onSubmit={onSubmit} 
            applicationData={editApplication} 
            open={isDialogOpen}
            onOpenChange={(open) => {
              onOpenChange(open);
              if (!open) onEditReset();
            }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic">
        * College application requirements vary by year and applicant pool. Given the increasing competitiveness of top university admissions, most admitted students exceed the published average academic criteria.
      </p>
    </div>
  );
}

