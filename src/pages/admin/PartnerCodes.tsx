import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Building2, Percent, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PartnerCode {
  id: string;
  company_name: string;
  promo_code: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PartnerCodes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PartnerCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    promo_code: "",
    discount_percentage: 10,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: partnerCodes, isLoading } = useQuery({
    queryKey: ["partner-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_codes")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return data as PartnerCode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("partner_codes").insert({
        company_name: data.company_name.trim(),
        promo_code: data.promo_code.toUpperCase().trim(),
        discount_percentage: data.discount_percentage,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-codes"] });
      toast.success("Partner code created successfully");
      closeDialog();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("This promo code already exists");
      } else {
        toast.error("Failed to create partner code");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("partner_codes")
        .update({
          company_name: data.company_name.trim(),
          promo_code: data.promo_code.toUpperCase().trim(),
          discount_percentage: data.discount_percentage,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-codes"] });
      toast.success("Partner code updated successfully");
      closeDialog();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("This promo code already exists");
      } else {
        toast.error("Failed to update partner code");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-codes"] });
      toast.success("Partner code deleted");
    },
    onError: () => {
      toast.error("Failed to delete partner code");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partner_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-codes"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const openCreateDialog = () => {
    setEditingCode(null);
    setFormData({
      company_name: "",
      promo_code: "",
      discount_percentage: 10,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (code: PartnerCode) => {
    setEditingCode(code);
    setFormData({
      company_name: code.company_name,
      promo_code: code.promo_code,
      discount_percentage: code.discount_percentage,
      is_active: code.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!formData.promo_code.trim()) {
      toast.error("Promo code is required");
      return;
    }
    if (formData.discount_percentage < 1 || formData.discount_percentage > 100) {
      toast.error("Discount must be between 1% and 100%");
      return;
    }

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = partnerCodes?.filter((c) => c.is_active).length || 0;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <AdminPageHeader
          title="Partner Codes"
          description="Manage promo codes for partner companies"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerCodes?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive Codes</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(partnerCodes?.length || 0) - activeCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner Code
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : partnerCodes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No partner codes yet. Click "Add Partner Code" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  partnerCodes?.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.company_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {code.promo_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code.promo_code, code.id)}
                          >
                            {copiedId === code.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{code.discount_percentage}% off</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: code.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(code)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete partner code for ${code.company_name}?`)) {
                                deleteMutation.mutate(code.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Edit Partner Code" : "Add Partner Code"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="e.g., Hills Gym"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_code">Promo Code *</Label>
                <Input
                  id="promo_code"
                  value={formData.promo_code}
                  onChange={(e) =>
                    setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., HILLSGYM10"
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  This is the code customers will enter at checkout
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount Percentage *</Label>
                <div className="relative">
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseInt(e.target.value) || 0,
                      })
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCode ? "Save Changes" : "Create Code"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
