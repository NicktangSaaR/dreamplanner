
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote } from "lucide-react";

interface NotesCardProps {
  notes: Array<{
    date: string;
  }>;
}

export default function NotesCard({ notes }: NotesCardProps) {
  const getLastUpdateDate = (notes: Array<{ date: string }>) => {
    if (notes.length === 0) return "No updates";
    const dates = notes.map(note => new Date(note.date));
    const latestDate = new Date(Math.max(...dates.map(date => date.getTime())));
    return latestDate.toLocaleDateString();
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notes
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{notes.length} Notes</div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Last updated: {getLastUpdateDate(notes)}</p>
          {notes.length > 0 && (
            <p className="text-xs">
              {notes.length} total entries
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
