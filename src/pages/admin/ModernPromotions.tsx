import React, { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Percent, Search, Eye, Filter, Plus, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function ModernPromotions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [showPromotionDetails, setShowPromotionDetails] = useState(false);

  const mockPromotions = [
    {
      id: "1",
      code: "SUMMER2024",
      type: "percentage",
      value: 20,
      description: "Summer wellness special",
      status: "active",
      usage_count: 45,
      usage_limit: 100,
      start_date: "2024-07-01",
      end_date: "2024-08-31",
      min_amount: 2000,
      created_at: "2024-06-15"
    },
    {
      id: "2",
      code: "NEWCUSTOMER",
      type: "fixed",
      value: 1000,
      description: "New customer welcome offer",
      status: "active",
      usage_count: 23,
      usage_limit: null,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      min_amount: 0,
      created_at: "2024-01-01"
    },
    {
      id: "3",
      code: "SPRING15",
      type: "percentage",
      value: 15,
      description: "Spring refresh discount",
      status: "expired",
      usage_count: 78,
      usage_limit: 100,
      start_date: "2024-03-01",
      end_date: "2024-05-31",
      min_amount: 1500,
      created_at: "2024-02-15"
    }
  ];

  const filteredPromotions = mockPromotions.filter(promotion => {
    const matchesSearch = promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || promotion.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const formatDiscount = (promotion: any) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}% off`;
    } else {
      return `${formatCurrency(promotion.value)} off`;
    }
  };

  const activePromotions = mockPromotions.filter(p => p.status === 'active').length;
  const totalUsage = mockPromotions.reduce((sum, p) => sum + p.usage_count, 0);
  const totalSavings = mockPromotions.reduce((sum, p) => {
    if (p.type === 'percentage') {
      return sum + (p.usage_count * 2000 * (p.value / 100));
    } else {
      return sum + (p.usage_count * p.value);
    }
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Promotions & Discounts
              </h1>
              <p className="text-gray-600 text-sm">Manage discount codes and promotional offers</p>
            </div>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Active Promotions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activePromotions}</div>
              <p className="text-xs text-purple-100 mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsage}</div>
              <p className="text-xs text-green-100 mt-1">Times redeemed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Customer Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalSavings)}</div>
              <p className="text-xs text-blue-100 mt-1">Total saved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12.5%</div>
              <p className="text-xs text-orange-100 mt-1">Promotion usage</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search promotions by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 shadow-md bg-white/80 backdrop-blur-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Promotions ({filteredPromotions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPromotions.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No promotions found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPromotions.map((promotion) => (
                  <div key={promotion.id} className="flex items-center justify-between p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-purple-200 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        <Percent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{promotion.code}</h3>
                          <Badge variant={
                            promotion.status === 'active' ? 'default' :
                            promotion.status === 'scheduled' ? 'secondary' :
                            promotion.status === 'expired' ? 'outline' : 'destructive'
                          }>
                            {promotion.status}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {formatDiscount(promotion)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 gap-6">
                          <div>{promotion.description}</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {format(new Date(promotion.start_date), "MMM d")} - {format(new Date(promotion.end_date), "MMM d, yyyy")}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 gap-6 mt-2">
                          <div>
                            <strong>Usage:</strong> {promotion.usage_count}
                            {promotion.usage_limit && ` / ${promotion.usage_limit}`}
                          </div>
                          {promotion.min_amount > 0 && (
                            <div>
                              <strong>Min amount:</strong> {formatCurrency(promotion.min_amount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {promotion.usage_count}
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        times used
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPromotion(promotion);
                          setShowPromotionDetails(true);
                        }}
                        className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Promotion Code</Label>
                  <Input id="code" placeholder="e.g. SUMMER2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description of the promotion" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Discount Value</Label>
                  <Input id="value" type="number" placeholder="20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Minimum Amount</Label>
                  <Input id="min_amount" type="number" placeholder="0" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" type="date" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                <Input id="usage_limit" type="number" placeholder="Leave empty for unlimited" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Active immediately</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button>
                  Create Promotion
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPromotionDetails} onOpenChange={setShowPromotionDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Promotion Details</DialogTitle>
            </DialogHeader>
            {selectedPromotion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Promotion Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Code:</strong> {selectedPromotion.code}</div>
                      <div><strong>Type:</strong> {selectedPromotion.type}</div>
                      <div><strong>Discount:</strong> {formatDiscount(selectedPromotion)}</div>
                      <div><strong>Status:</strong> {selectedPromotion.status}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Usage Statistics</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Times Used:</strong> {selectedPromotion.usage_count}</div>
                      <div><strong>Usage Limit:</strong> {selectedPromotion.usage_limit || "Unlimited"}</div>
                      <div><strong>Min Amount:</strong> {selectedPromotion.min_amount > 0 ? formatCurrency(selectedPromotion.min_amount) : "None"}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedPromotion.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Validity Period</h3>
                  <div className="text-sm">
                    <strong>Start:</strong> {format(new Date(selectedPromotion.start_date), "MMMM d, yyyy")}
                    <br />
                    <strong>End:</strong> {format(new Date(selectedPromotion.end_date), "MMMM d, yyyy")}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
