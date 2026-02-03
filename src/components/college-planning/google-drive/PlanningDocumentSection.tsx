import { useState, useCallback } from "react";
import GoogleDriveConnect from "./GoogleDriveConnect";
import GoogleDriveFileList from "./GoogleDriveFileList";
import PlanningDocumentViewer from "./PlanningDocumentViewer";
import PlanningMilestones from "./PlanningMilestones";

interface PlanningDocumentSectionProps {
  studentId: string;
}

export default function PlanningDocumentSection({ studentId }: PlanningDocumentSectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string | null>(null);
  const [milestonesRefresh, setMilestonesRefresh] = useState(0);

  const handleConnectionChange = useCallback((connected: boolean, folder?: string) => {
    setIsConnected(connected);
    setFolderId(folder || null);
  }, []);

  const handleFolderChange = useCallback((newFolderId: string) => {
    setFolderId(newFolderId);
    setSelectedDocId(null);
    setSelectedDocName(null);
  }, []);

  const handleSelectDocument = useCallback((fileId: string, fileName: string) => {
    setSelectedDocId(fileId);
    setSelectedDocName(fileName);
  }, []);

  const handleMilestonesExtracted = useCallback(() => {
    setMilestonesRefresh(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Google Drive Connection Status */}
      <GoogleDriveConnect 
        studentId={studentId} 
        onConnectionChange={handleConnectionChange}
      />

      {/* Main Content - Only show when connected */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - File List and Milestones */}
          <div className="space-y-6">
            <GoogleDriveFileList
              studentId={studentId}
              folderId={folderId}
              onSelectDocument={handleSelectDocument}
              onFolderChange={handleFolderChange}
            />
            <PlanningMilestones
              studentId={studentId}
              refreshTrigger={milestonesRefresh}
            />
          </div>

          {/* Right Column - Document Viewer */}
          <div>
            <PlanningDocumentViewer
              studentId={studentId}
              documentId={selectedDocId}
              documentName={selectedDocName}
              onMilestonesExtracted={handleMilestonesExtracted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
