
import { Button } from "@/components/ui/button";
import { UniversityType } from "../types";
import { getUniversityTypeDisplay } from "../utils/displayUtils";

interface UniversityTypeTabsProps {
  activeTab: UniversityType | 'all';
  setActiveTab: (tab: UniversityType | 'all') => void;
  universityTypes: (UniversityType | 'all')[];
}

export const UniversityTypeTabs = ({ 
  activeTab, 
  setActiveTab, 
  universityTypes 
}: UniversityTypeTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {universityTypes.map(type => (
        <Button
          key={type}
          variant={activeTab === type ? 'default' : 'outline'}
          onClick={() => setActiveTab(type)}
          size="sm"
        >
          {type === 'all' ? 'All Evaluations' : getUniversityTypeDisplay(type as UniversityType)}
        </Button>
      ))}
    </div>
  );
};
