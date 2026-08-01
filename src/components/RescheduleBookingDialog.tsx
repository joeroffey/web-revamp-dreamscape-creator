import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingType: string;
  onSuccess: () => void;
}

export const RescheduleBookingDialog = ({ open, onOpenChange, bookingId, bookingType, onSuccess }: Props) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedSlotId) {
      toast({ title: "Please select a new time slot", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("user-reschedule-booking", {
        body: { bookingId, newTimeSlotId: selectedSlotId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Booking updated", description: "Your booking has been rescheduled." });
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not reschedule", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
          <DialogDescription>
            Choose a new available time slot. Your previous slot will be released for others to book.
          </DialogDescription>
        </DialogHeader>

        <TimeSlotPicker
          serviceType={bookingType === "private" ? "private" : "combined"}
          onSlotSelect={(slotId) => setSelectedSlotId(slotId)}
          selectedSlotId={selectedSlotId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedSlotId}>
            {submitting ? "Updating..." : "Confirm new time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
