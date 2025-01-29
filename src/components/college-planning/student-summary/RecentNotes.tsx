import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  author_name?: string;
}

interface RecentNotesProps {
  notes: Note[];
}

export default function RecentNotes({ notes }: RecentNotesProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Notes</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg border bg-card"
              >
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{note.created_at && new Date(note.created_at).toLocaleDateString()}</span>
                  {note.author_name && <span>By: {note.author_name}</span>}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-muted-foreground">No notes found</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}