import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, Calendar, Bell, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistDialog({ open, onOpenChange }: WaitlistDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_search: "",
    service_type: "",
    preferred_date: "",
    preferred_time: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: waitlistEntries, isLoading } = useQuery({
    queryKey: ["waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select(`
          *,
          customer:profiles(full_name, email, phone)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: customers } = useQuery({
    queryKey: ["customer-search", addForm.customer_search],
    queryFn: async () => {
      if (!addForm.customer_search.trim()) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`full_name.ilike.%${addForm.customer_search}%,email.ilike.%${addForm.customer_search}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: addForm.customer_search.length > 2,
  });

  const addToWaitlistMutation = useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await supabase
        .from("waitlist")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success("Added to waitlist successfully");
      setShowAddForm(false);
      setAddForm({
        customer_search: "",
        service_type: "",
        preferred_date: "",
        preferred_time: "",
        notes: ""
      });
    },
    onError: (error) => {
      toast.error("Failed to add to waitlist");
      console.error("Waitlist error:", error);
    },
  });

  const updateWaitlistMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await supabase
        .from("waitlist")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success("Waitlist updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update waitlist");
      console.error("Update error:", error);
    },
  });

  const handleAddToWaitlist = (customerId: string) => {
    if (!customerId || !addForm.service_type) {
      toast.error("Please select a customer and service type");
      return;
    }

    addToWaitlistMutation.mutate({
      customer_id: customerId,
      service_type: addForm.service_type,
      preferred_date: addForm.preferred_date || null,
      preferred_time: addForm.preferred_time || null,
      notes: addForm.notes || null,
      status: "active"
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateWaitlistMutation.mutate({ id, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Waitlist Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {waitlistEntries?.length || 0} customers waiting
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "Add to Waitlist"}
            </Button>
          </div>

          {showAddForm && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-medium">Add Customer to Waitlist</h3>
              
              <div className="space-y-2">
                <Label>Search Customer</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={addForm.customer_search}
                  onChange={(e) => setAddForm({ ...addForm, customer_search: e.target.value })}
                />
                
                {customers && customers.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 border rounded cursor-pointer hover:bg-white"
                        onClick={() => setAddForm({ ...addForm, customer_search: customer.full_name || customer.email || "" })}
                      >
                        <div className="font-medium">{customer.full_name || "No name"}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={addForm.service_type} onValueChange={(value) => setAddForm({ ...addForm, service_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="communal">Communal Session</SelectItem>
                      <SelectItem value="private">Private Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={addForm.preferred_date}
                    onChange={(e) => setAddForm({ ...addForm, preferred_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={addForm.preferred_time}
                    onChange={(e) => setAddForm({ ...addForm, preferred_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any special requirements..."
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  const selectedCustomer = customers?.find(c => 
                    c.full_name === addForm.customer_search || c.email === addForm.customer_search
                  );
                  if (selectedCustomer) {
                    handleAddToWaitlist(selectedCustomer.id);
                  }
                }}
                disabled={addToWaitlistMutation.isPending}
                className="w-full"
              >
                Add to Waitlist
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading waitlist...</div>
            ) : waitlistEntries && waitlistEntries.length > 0 ? (
              waitlistEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {entry.customer?.full_name || "Unknown Customer"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.customer?.email} • {entry.service_type}
                        </div>
                        {entry.preferred_date && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Prefers: {format(new Date(entry.preferred_date), "MMM d, yyyy")}
                            {entry.preferred_time && ` at ${entry.preferred_time}`}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>Notes:</strong> {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Waiting {Math.ceil((new Date().getTime() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(entry.id, "notified")}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(entry.id, "booked")}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(entry.id, "cancelled")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No customers on the waitlist
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
