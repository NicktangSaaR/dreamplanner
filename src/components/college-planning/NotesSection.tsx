import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Save, X, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
  });

  const handleAddNote = () => {
    if (newNote.title && newNote.content) {
      setNotes([
        {
          id: Date.now().toString(),
          ...newNote,
          date: new Date().toLocaleDateString(),
        },
        ...notes,
      ]);
      setNewNote({ title: "", content: "" });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleSaveEdit = () => {
    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id ? editingNote : note
        )
      );
      setEditingNote(null);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="noteTitle">Title</Label>
            <Input
              id="noteTitle"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              placeholder="Note title"
            />
          </div>
          <div>
            <Label htmlFor="noteContent">Content</Label>
            <Textarea
              id="noteContent"
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
              placeholder="Write your note here..."
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleAddNote} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {notes.map((note) =>
              editingNote?.id === note.id ? (
                <Card key={note.id}>
                  <CardContent className="pt-6 space-y-4">
                    <Input
                      value={editingNote.title}
                      onChange={(e) =>
                        setEditingNote({
                          ...editingNote,
                          title: e.target.value,
                        })
                      }
                    />
                    <Textarea
                      value={editingNote.content}
                      onChange={(e) =>
                        setEditingNote({
                          ...editingNote,
                          content: e.target.value,
                        })
                      }
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveEdit}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingNote(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={note.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{note.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {note.date}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditNote(note)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}