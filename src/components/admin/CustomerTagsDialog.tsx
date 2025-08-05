import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

interface CustomerTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  currentTags: string[];
  customerType: string;
}

const PREDEFINED_TAGS = [
  "VIP",
  "Regular",
  "New Customer",
  "Frequent Visitor",
  "Special Needs",
  "Prefers Morning",
  "Prefers Evening",
  "Ice Bath Only",
  "Sauna Only",
  "Combined Sessions",
  "Group Bookings",
  "Corporate",
  "Student",
  "Senior",
  "Local",
  "Tourist"
];

const CUSTOMER_TYPES = [
  "regular",
  "vip",
  "new",
  "corporate",
  "student",
  "senior"
];

export function CustomerTagsDialog({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  currentTags, 
  customerType 
}: CustomerTagsDialogProps) {
  const [tags, setTags] = useState<string[]>(currentTags || []);
  const [newTag, setNewTag] = useState("");
  const [selectedCustomerType, setSelectedCustomerType] = useState(customerType || "regular");
  const queryClient = useQueryClient();

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ tags, customerType }: { tags: string[], customerType: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ 
          tags,
          customer_type: customerType
        })
        .eq("id", customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Customer updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update customer");
      console.error("Error updating customer:", error);
    },
  });

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag("");
    }
  };

  const handleSave = () => {
    updateCustomerMutation.mutate({ 
      tags, 
      customerType: selectedCustomerType 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Tags & Type for {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Customer Type</label>
            <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Current Tags</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No tags assigned</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Add Predefined Tags</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.filter(tag => !tags.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Add Custom Tag</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <Button onClick={handleAddCustomTag} disabled={!newTag.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateCustomerMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
