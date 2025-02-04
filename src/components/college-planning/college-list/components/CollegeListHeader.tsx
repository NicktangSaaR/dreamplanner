
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
    <div className="flex justify-between items-center print:hidden">
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
  );
}
