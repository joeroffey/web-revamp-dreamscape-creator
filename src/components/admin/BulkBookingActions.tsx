import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Mail, X, Calendar, Download } from "lucide-react";
import { toast } from "sonner";

interface BulkBookingActionsProps {
  selectedBookings: string[];
  onClearSelection: () => void;
}

export function BulkBookingActions({ selectedBookings, onClearSelection }: BulkBookingActionsProps) {
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkMessage, setBulkMessage] = useState("");
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, message }: { action: string, message?: string }) => {
      if (action === "status_change") {
        const newStatus = message;
        const { error } = await supabase
          .from("bookings")
          .update({ booking_status: newStatus })
          .in("id", selectedBookings);
        
        if (error) throw error;
      } else if (action === "cancel") {
        const { error } = await supabase
          .from("bookings")
          .update({ 
            booking_status: "cancelled",
            notes: message ? `Cancelled: ${message}` : "Cancelled via bulk action"
          })
          .in("id", selectedBookings);
        
        if (error) throw error;
      } else if (action === "export") {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            customer:profiles(full_name, email, phone)
          `)
          .in("id", selectedBookings);
        
        if (error) throw error;
        
        const csvContent = [
          ["Date", "Time", "Service", "Customer", "Email", "Phone", "Status", "Amount", "Notes"].join(","),
          ...data.map(booking => [
            booking.session_date || "",
            booking.session_time || "",
            booking.service_type || "",
            booking.customer_name || "",
            booking.customer_email || "",
            booking.customer_phone || "",
            booking.booking_status,
            booking.price_amount || 0,
            booking.special_requests || ""
          ].map(field => `"${field}"`).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`Bulk action completed for ${selectedBookings.length} bookings`);
      setShowBulkDialog(false);
      setBulkAction("");
      setBulkMessage("");
      onClearSelection();
    },
    onError: (error) => {
      toast.error("Failed to perform bulk action");
      console.error("Bulk action error:", error);
    },
  });

  const handleBulkAction = () => {
    if (!bulkAction) return;
    
    if (bulkAction === "export") {
      bulkUpdateMutation.mutate({ action: "export" });
    } else {
      bulkUpdateMutation.mutate({ action: bulkAction, message: bulkMessage });
    }
  };

  if (selectedBookings.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <CheckSquare className="h-5 w-5 text-blue-600" />
        <span className="text-blue-800 font-medium">
          {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkAction("status_change");
              setShowBulkDialog(true);
            }}
          >
            Change Status
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkAction("cancel");
              setShowBulkDialog(true);
            }}
          >
            Cancel Bookings
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkAction("export");
              bulkUpdateMutation.mutate({ action: "export" });
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk Action: {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {bulkAction === "status_change" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={bulkMessage} onValueChange={setBulkMessage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkAction === "cancel" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cancellation Reason (Optional)</label>
                <Textarea
                  placeholder="Enter reason for cancellation..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAction}
                disabled={bulkUpdateMutation.isPending || (bulkAction === "status_change" && !bulkMessage)}
              >
                Apply to {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
