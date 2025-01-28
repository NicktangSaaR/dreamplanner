import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";

interface SharedFolder {
  title: string;
  folder_url: string;
  description?: string;
}

interface SharedFolderCardProps {
  folder: SharedFolder | null;
  onEditClick: () => void;
}

export default function SharedFolderCard({ folder, onEditClick }: SharedFolderCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shared Folder</CardTitle>
        <Button onClick={onEditClick} size="sm">
          {folder ? 'Edit Folder' : 'Add Folder'}
        </Button>
      </CardHeader>
      <CardContent>
        {folder ? (
          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
            <div className="flex-shrink-0">
              <FolderOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <a 
                href={folder.folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold hover:text-blue-500 transition-colors"
              >
                {folder.title}
              </a>
              {folder.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No shared folder added yet</p>
        )}
      </CardContent>
    </Card>
  );
}