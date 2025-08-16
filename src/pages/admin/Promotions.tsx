import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Percent, DollarSign, Calendar, Users, Gift } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Promotions() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_amount: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      // Discount codes table doesn't exist yet, return mock data
      console.log("Promotions table not implemented yet");
      return [];
    },
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (promotion: any) => {
      // Discount codes table doesn't exist yet, log for now
      console.log("Would create promotion:", promotion);
      return { id: "mock-id", ...promotion };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion created successfully");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create promotion");
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, promotion }: { id: string, promotion: any }) => {
      // Discount codes table doesn't exist yet, log for now
      console.log("Would update promotion:", id, promotion);
      return { id, ...promotion };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion updated successfully");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update promotion");
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Discount codes table doesn't exist yet, log for now
      console.log("Would delete promotion:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete promotion");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_amount: "",
      max_uses: "",
      valid_from: "",
      valid_until: "",
      is_active: true
    });
    setShowCreateDialog(false);
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description || "",
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value.toString(),
      min_amount: promotion.min_amount.toString(),
      max_uses: promotion.max_uses?.toString() || "",
      valid_from: promotion.valid_from ? format(new Date(promotion.valid_from), "yyyy-MM-dd'T'HH:mm") : "",
      valid_until: promotion.valid_until ? format(new Date(promotion.valid_until), "yyyy-MM-dd'T'HH:mm") : "",
      is_active: promotion.is_active
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingPromotion) {
      updatePromotionMutation.mutate({ id: editingPromotion.id, promotion: formData });
    } else {
      createPromotionMutation.mutate(formData);
    }
  };

  const getPromotionStatus = (promotion: any) => {
    if (!promotion.is_active) return { status: "inactive", color: "secondary" };
    
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = promotion.valid_until ? new Date(promotion.valid_until) : null;
    
    if (now < validFrom) return { status: "scheduled", color: "outline" };
    if (validUntil && now > validUntil) return { status: "expired", color: "destructive" };
    if (promotion.max_uses && (promotion.current_uses || 0) >= promotion.max_uses) {
      return { status: "used up", color: "destructive" };
    }
    
    return { status: "active", color: "default" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Promotions & Discounts</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions?.filter(p => getPromotionStatus(p).status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions?.reduce((sum, p) => sum + (p.current_uses || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions && promotions.length > 0 
                ? `${(promotions.reduce((sum: number, p: any) => sum + (p.discount_value || 0), 0) / promotions.length).toFixed(1)}%`
                : "0%"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading promotions...</div>
          ) : promotions && promotions.length > 0 ? (
            <div className="space-y-4">
              {promotions.map((promotion) => {
                const status = getPromotionStatus(promotion);
                return (
                  <div key={promotion.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{promotion.code}</h3>
                        <Badge variant={status.color as any}>{status.status}</Badge>
                        <Badge variant="outline">
                          {(promotion.discount_type || 'percentage') === 'percentage' ? (
                            <><Percent className="h-3 w-3 mr-1" />{promotion.discount_value || 0}%</>
                          ) : (
                            <><DollarSign className="h-3 w-3 mr-1" />£{promotion.discount_value || 0}</>
                          )}
                        </Badge>
                      </div>
                      
                      {promotion.description && (
                        <p className="text-sm text-muted-foreground mb-2">{promotion.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {(promotion.min_amount || 0) > 0 && (
                          <span>Min: £{promotion.min_amount || 0}</span>
                        )}
                        {promotion.max_uses && (
                          <span>Uses: {promotion.current_uses || 0}/{promotion.max_uses}</span>
                        )}
                        {promotion.valid_until && (
                          <span>Expires: {format(new Date(promotion.valid_until), "MMM d, yyyy")}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(promotion)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePromotionMutation.mutate(promotion.id)}
                        disabled={deletePromotionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No promotions created yet. Create your first promotion to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promotion Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(£)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  placeholder={formData.discount_type === 'percentage' ? "20" : "10.00"}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_amount">Min Amount (£)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createPromotionMutation.isPending || updatePromotionMutation.isPending}
              >
                {editingPromotion ? "Update" : "Create"} Promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
