import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Gift, Search, Eye, PoundSterling, Calendar, TrendingUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatGBP } from "@/lib/format";

export default function ModernGiftCardManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGiftCard, setSelectedGiftCard] = useState<any>(null);
  const [showGiftCardDetails, setShowGiftCardDetails] = useState(false);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [giftCardToDelete, setGiftCardToDelete] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error) {
      console.error("Error fetching gift cards:", error);
      toast({
        title: "Error",
        description: "Failed to load gift cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteGiftCard = async () => {
    if (!giftCardToDelete) return;
    try {
      const { error } = await supabase
        .from('gift_cards')
        .delete()
        .eq('id', giftCardToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gift card deleted successfully",
      });
      fetchGiftCards();
      setDeleteDialogOpen(false);
      setGiftCardToDelete(null);
    } catch (error: any) {
      console.error('Error deleting gift card:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete gift card",
        variant: "destructive",
      });
    }
  };

  const filteredGiftCards = giftCards.filter(giftCard => {
    const matchesSearch = giftCard.gift_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      giftCard.purchaser_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (giftCard.recipient_email && giftCard.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const formatCurrency = formatGBP;

  // Only count paid gift cards in stats
  const paidGiftCards = giftCards.filter(gc => gc.payment_status === 'paid');
  const totalValue = paidGiftCards.reduce((sum, gc) => sum + gc.amount, 0);
  const redeemedCards = paidGiftCards.filter(gc => gc.is_redeemed).length;
  const redeemedValue = paidGiftCards.filter(gc => gc.is_redeemed).reduce((sum, gc) => sum + gc.amount, 0);
  const pendingPaymentCards = giftCards.filter(gc => gc.payment_status === 'pending').length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader title="Gift Cards" description="Create, track and redeem gift cards." />
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Gift Cards" description="Manage and track all gift cards." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-pink-100 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Paid Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{paidGiftCards.length}</div>
              <p className="text-xs text-pink-100 mt-1">All gift cards</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-green-100 mt-1">Cards issued</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Redeemed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(redeemedValue)}</div>
              <p className="text-xs text-purple-100 mt-1">{redeemedCards} cards redeemed</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search gift cards by code, purchaser, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 shadow-md bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Gift Cards ({filteredGiftCards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGiftCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No gift cards found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGiftCards.map((giftCard) => (
                  <div key={giftCard.id} className="flex items-center justify-between p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-pink-200 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        <Gift className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{giftCard.gift_code}</h3>
                          <Badge variant={
                            giftCard.payment_status === 'pending' ? 'outline' :
                            giftCard.is_redeemed ? 'secondary' :
                            new Date(giftCard.expires_at) < new Date() ? 'destructive' : 'default'
                          } className={giftCard.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}>
                            {giftCard.payment_status === 'pending' ? 'Awaiting Payment' :
                             giftCard.is_redeemed ? 'Redeemed' : 
                             new Date(giftCard.expires_at) < new Date() ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 gap-6">
                          <div>From: {giftCard.purchaser_name} ({giftCard.purchaser_email})</div>
                          {giftCard.recipient_name && (
                            <div>To: {giftCard.recipient_name} ({giftCard.recipient_email})</div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {format(new Date(giftCard.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                        
                        {giftCard.message && (
                          <div className="text-sm text-gray-600 mt-2 italic">
                            "{giftCard.message}"
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(giftCard.is_redeemed ? 0 : giftCard.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {formatCurrency(giftCard.amount)}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Expires: {format(new Date(giftCard.expires_at), "MMM d, yyyy")}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGiftCard(giftCard);
                            setShowGiftCardDetails(true);
                          }}
                          className="hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGiftCardToDelete(giftCard);
                            setDeleteDialogOpen(true);
                          }}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showGiftCardDetails} onOpenChange={setShowGiftCardDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gift Card Details</DialogTitle>
            </DialogHeader>
            {selectedGiftCard && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Gift Card Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Code:</strong> {selectedGiftCard.gift_code}</div>
                      <div><strong>Original Amount:</strong> {formatCurrency(selectedGiftCard.amount)}</div>
                      <div><strong>Current Balance:</strong> {formatCurrency(selectedGiftCard.is_redeemed ? 0 : selectedGiftCard.amount)}</div>
                      <div><strong>Payment Status:</strong> {selectedGiftCard.payment_status === 'paid' ? 'Paid' : 'Awaiting Payment'}</div>
                      <div><strong>Status:</strong> {selectedGiftCard.payment_status !== 'paid' ? 'Awaiting Payment' : selectedGiftCard.is_redeemed ? 'Redeemed' : 'Active'}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Purchase Details</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Purchased by:</strong> {selectedGiftCard.purchaser_name} ({selectedGiftCard.purchaser_email})</div>
                      <div><strong>Recipient:</strong> {selectedGiftCard.recipient_name ? `${selectedGiftCard.recipient_name} (${selectedGiftCard.recipient_email})` : 'N/A'}</div>
                      <div><strong>Purchase Date:</strong> {format(new Date(selectedGiftCard.created_at), "MMM d, yyyy")}</div>
                      <div><strong>Expires:</strong> {format(new Date(selectedGiftCard.expires_at), "MMM d, yyyy")}</div>
                    </div>
                  </div>
                </div>
                
                {selectedGiftCard.message && (
                  <div>
                    <h3 className="font-semibold mb-2">Personal Message</h3>
                    <p className="text-sm bg-gray-50 p-3 rounded italic">"{selectedGiftCard.message}"</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Usage History</h3>
                  <div className="text-sm text-gray-600">
                    {selectedGiftCard.is_redeemed && selectedGiftCard.redeemed_at ? 
                      `Redeemed on ${format(new Date(selectedGiftCard.redeemed_at), "MMM d, yyyy")}` + 
                      (selectedGiftCard.redeemed_by ? ` by ${selectedGiftCard.redeemed_by}` : '') :
                      'Not yet redeemed'
                    }
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Gift Card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete gift card <strong>{giftCardToDelete?.gift_code}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGiftCardToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteGiftCard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
