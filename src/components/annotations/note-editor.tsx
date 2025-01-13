"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, MessageSquare, Save } from "lucide-react";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteEditorProps {
  paperId: string;
  initialNotes?: Note[];
  onSave?: (note: Omit<Note, "id">) => Promise<void>;
  onUpdate?: (note: Note) => Promise<void>;
  onDelete?: (noteId: string) => Promise<void>;
}

export function NoteEditor({
  paperId,
  initialNotes = [],
  onSave,
  onUpdate,
  onDelete,
}: NoteEditorProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsLoading(true);
    try {
      const newNote = {
        content: newNoteContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await onSave?.(newNote);
      setNotes([...notes, { ...newNote, id: Date.now().toString() }]);
      setNewNoteContent("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (note: Note) => {
    setIsLoading(true);
    try {
      await onUpdate?.(note);
      setNotes(notes.map((n) => (n.id === note.id ? note : n)));
      setEditingNoteId(null);
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsLoading(true);
    try {
      await onDelete?.(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Button
        className="w-full justify-start"
        onClick={() => setIsCreating(true)}
        disabled={isCreating}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add note
      </Button>

      {isCreating && (
        <Card className="p-4">
          <Textarea
            placeholder="Write your note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="mb-4"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewNoteContent("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={isLoading}>
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className="p-4">
            {editingNoteId === note.id ? (
              <div className="space-y-4">
                <Textarea
                  value={note.content}
                  onChange={(e) =>
                    setNotes(
                      notes.map((n) =>
                        n.id === note.id
                          ? { ...n, content: e.target.value }
                          : n
                      )
                    )
                  }
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingNoteId(null)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateNote({
                        ...note,
                        updatedAt: new Date(),
                      })
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4">{note.content}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString()} at{" "}
                    {new Date(note.updatedAt).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingNoteId(note.id)}
                    >
                      <Edit className="h-4 w-4" />
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
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 