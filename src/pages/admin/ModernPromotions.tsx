import React, { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string | null;
  is_active: boolean;
  current_uses: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
  min_amount: number | null;
  created_at: string;
}

export default function ModernPromotions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<DiscountCode | null>(null);
  const [showPromotionDetails, setShowPromotionDetails] = useState(false);
  const [promotions, setPromotions] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions((data as unknown as DiscountCode[]) || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionStatus = (promotion: DiscountCode) => {
    if (!promotion.is_active) return 'inactive';
    
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = new Date(promotion.valid_until);
    
    if (now < validFrom) return 'scheduled';
    if (now > validUntil) return 'expired';
    if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) return 'exhausted';
    
    return 'active';
  };

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promotion.description && promotion.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const promotionStatus = getPromotionStatus(promotion);
    const matchesStatus = statusFilter === "all" || promotionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}% off`;
    }
    return formatCurrency(value);
  };

  const totalUsage = promotions.reduce((sum, promo) => sum + promo.current_uses, 0);
  const activePromotions = promotions.filter(p => getPromotionStatus(p) === 'active').length;
  const totalSavings = promotions.reduce((sum, promo) => {
    if (promo.discount_type === 'percentage') {
      return sum + (promo.current_uses * 1000);
    }
    return sum + (promo.current_uses * promo.discount_value);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
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
              <CardTitle className="text-sm font-medium text-green-100">
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
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Savings
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
              <CardTitle className="text-sm font-medium text-orange-100">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{promotions.length > 0 ? ((activePromotions / promotions.length) * 100).toFixed(1) : 0}%</div>
              <p className="text-xs text-orange-100 mt-1">Promotion usage</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 backdrop-blur-sm border-gray-200">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Promotions ({filteredPromotions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-6 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPromotions.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No promotions found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPromotions.map((promotion) => {
                  const promotionStatus = getPromotionStatus(promotion);
                  return (
                    <div key={promotion.id} className="flex items-center justify-between p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-purple-200 bg-white/60 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          <Percent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{promotion.code}</h3>
                            <Badge variant={
                              promotionStatus === 'active' ? 'default' :
                              promotionStatus === 'scheduled' ? 'secondary' :
                              promotionStatus === 'expired' ? 'outline' : 'destructive'
                            }>
                              {promotionStatus}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {formatDiscount(promotion.discount_type, promotion.discount_value)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 gap-6">
                            <div>{promotion.description || 'No description'}</div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              {format(new Date(promotion.valid_from), "MMM d")} - {format(new Date(promotion.valid_until), "MMM d, yyyy")}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
                            <div>Usage: {promotion.current_uses}{promotion.max_uses ? ` / ${promotion.max_uses}` : ''}</div>
                            {promotion.min_amount && <div>Min amount: {formatCurrency(promotion.min_amount)}</div>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {promotion.current_uses}
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPromotionDetails} onOpenChange={setShowPromotionDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Promotion Details</DialogTitle>
            </DialogHeader>
            {selectedPromotion && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Promotion Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Code:</strong> {selectedPromotion.code}</div>
                    <div><strong>Type:</strong> {selectedPromotion.discount_type}</div>
                    <div><strong>Value:</strong> {formatDiscount(selectedPromotion.discount_type, selectedPromotion.discount_value)}</div>
                    <div><strong>Status:</strong> {getPromotionStatus(selectedPromotion)}</div>
                    <div><strong>Description:</strong> {selectedPromotion.description || 'No description'}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage & Validity</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Usage Count:</strong> {selectedPromotion.current_uses}</div>
                    <div><strong>Usage Limit:</strong> {selectedPromotion.max_uses || 'Unlimited'}</div>
                    <div><strong>Valid From:</strong> {format(new Date(selectedPromotion.valid_from), "MMM d, yyyy")}</div>
                    <div><strong>Valid Until:</strong> {format(new Date(selectedPromotion.valid_until), "MMM d, yyyy")}</div>
                    <div><strong>Min Amount:</strong> {selectedPromotion.min_amount ? formatCurrency(selectedPromotion.min_amount) : 'None'}</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promotion Code</Label>
                  <Input id="code" placeholder="e.g., SUMMER2024" />
                </div>
                <div>
                  <Label htmlFor="type">Discount Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe this promotion..." />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Promotion
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
