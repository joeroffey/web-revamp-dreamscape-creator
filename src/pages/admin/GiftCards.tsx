import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Gift, Mail, User, Calendar, PoundSterling } from 'lucide-react';

interface GiftCard {
  id: string;
  gift_code: string;
  amount: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  expires_at: string;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name: string | null;
  recipient_email: string | null;
  message: string | null;
  payment_status: string;
  created_at: string;
  redeemed_by: string | null;
}

export default function AdminGiftCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGiftCards = giftCards.filter(card => {
    const matchesSearch = 
      card.gift_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.purchaser_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.purchaser_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.recipient_name && card.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.recipient_email && card.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()));

    const now = new Date();
    const expiresAt = new Date(card.expires_at);
    const isExpired = expiresAt < now;

    switch (filter) {
      case 'active':
        return matchesSearch && !card.is_redeemed && !isExpired;
      case 'redeemed':
        return matchesSearch && card.is_redeemed;
      case 'expired':
        return matchesSearch && !card.is_redeemed && isExpired;
      default:
        return matchesSearch;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const getCardStatus = (card: GiftCard) => {
    if (card.is_redeemed) return { label: 'Redeemed', variant: 'secondary' as const };
    
    const now = new Date();
    const expiresAt = new Date(card.expires_at);
    if (expiresAt < now) return { label: 'Expired', variant: 'destructive' as const };
    
    return { label: 'Active', variant: 'default' as const };
  };

  const stats = {
    total: giftCards.length,
    active: giftCards.filter(card => !card.is_redeemed && new Date(card.expires_at) >= new Date()).length,
    redeemed: giftCards.filter(card => card.is_redeemed).length,
    totalValue: giftCards.filter(card => !card.is_redeemed).reduce((sum, card) => sum + card.amount, 0),
    redeemedValue: giftCards.filter(card => card.is_redeemed).reduce((sum, card) => sum + card.amount, 0)
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Gift Card Management</h1>
          <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Gift Card Management</h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gift cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Cards' },
            { key: 'active', label: 'Active' },
            { key: 'redeemed', label: 'Redeemed' },
            { key: 'expired', label: 'Expired' }
          ].map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? 'default' : 'outline'}
              onClick={() => setFilter(filterOption.key as any)}
              size="sm"
              className="min-h-[44px]"
            >
              {filterOption.label}
            </Button>
          ))}
        </div>

        {/* Gift Card Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Redeemed Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.redeemed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Redeemed Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.redeemedValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gift Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Gift Cards ({filteredGiftCards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGiftCards.length === 0 ? (
              <p className="text-muted-foreground">No gift cards found.</p>
            ) : (
              <div className="space-y-4">
                {filteredGiftCards.map((card) => {
                  const status = getCardStatus(card);
                  return (
                    <div 
                      key={card.id} 
                      className="flex flex-col p-4 border rounded-lg hover:bg-accent transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Gift className="h-4 w-4 text-purple-600" />
                            <span className="font-mono font-medium">{card.gift_code}</span>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <span className="font-medium text-lg">{formatCurrency(card.amount)}</span>
                        </div>
                        
                        <div className="text-left sm:text-right">
                          <div className={`text-sm ${
                            card.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            Payment: {card.payment_status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="break-all">From: {card.purchaser_name} ({card.purchaser_email})</span>
                        </div>
                        {card.recipient_name && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">To: {card.recipient_name} ({card.recipient_email})</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Purchased: {new Date(card.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Expires: {new Date(card.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {card.message && (
                        <div className="text-sm bg-muted p-3 rounded">
                          <span className="font-medium">Message:</span> "{card.message}"
                        </div>
                      )}

                      {card.is_redeemed && card.redeemed_at && (
                        <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded">
                          <span className="font-medium">Redeemed:</span> {new Date(card.redeemed_at).toLocaleDateString()}
                          {card.redeemed_by && <span> by {card.redeemed_by}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
