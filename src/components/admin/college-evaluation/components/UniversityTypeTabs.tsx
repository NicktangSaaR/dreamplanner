
import { Button } from "@/components/ui/button";
import { UniversityType } from "../types";
import { getUniversityTypeDisplay } from "../utils/displayUtils";

interface UniversityTypeTabsProps {
  activeTab: UniversityType | 'all';
  setActiveTab: (tab: UniversityType | 'all') => void;
  universityTypes: (UniversityType | string)[];
}

export const UniversityTypeTabs = ({ 
  activeTab, 
  setActiveTab, 
  universityTypes 
}: UniversityTypeTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={activeTab === 'all' ? 'default' : 'outline'}
        onClick={() => setActiveTab('all')}
        size="sm"
      >
        All Evaluations
      </Button>
      {universityTypes.map(type => (
        <Button
          key={type}
          variant={activeTab === type ? 'default' : 'outline'}
          onClick={() => setActiveTab(type as UniversityType)}
          size="sm"
        >
          {getUniversityTypeDisplay(type as UniversityType)}
        </Button>
      ))}
    </div>
  );
};
