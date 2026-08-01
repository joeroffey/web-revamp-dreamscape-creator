import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CustomerNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function CustomerNotesDialog({ open, onOpenChange, customerId, customerName }: CustomerNotesDialogProps) {
  const [newNote, setNewNote] = useState("");
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["customer-notes", customerId],
    queryFn: async () => {
      return [];
    },
    enabled: open && !!customerId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      console.log("Adding note:", note);
      return { id: Date.now().toString(), note, created_at: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notes", customerId] });
      setNewNote("");
      toast.success("Note added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add note");
      console.error("Error adding note:", error);
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes for {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Add New Note</label>
            <Textarea
              placeholder="Enter note about customer interaction, preferences, etc..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAddNote}
              disabled={!newNote.trim() || addNoteMutation.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Previous Notes</label>
            <ScrollArea className="h-64 border rounded-md p-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading notes...</div>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">
                          Admin User
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        Sample note content
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No notes yet. Add the first note above.
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
