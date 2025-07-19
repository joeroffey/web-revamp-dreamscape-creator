import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Mail, Phone, Calendar, Gift, CreditCard, Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  total_bookings: number;
  total_spent: number;
  active_gift_cards: number;
  active_memberships: number;
  email?: string;
  bookings?: any[];
  gift_cards?: any[];
  memberships?: any[];
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Get profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, get additional data
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get user email from auth.users (we can't query this directly, so we'll use bookings/gift_cards)
          const { data: bookings } = await supabase
            .from('bookings')
            .select('customer_email, price_amount')
            .eq('user_id', profile.id);

          const { data: giftCards } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('purchaser_email', bookings?.[0]?.customer_email || '')
            .eq('is_redeemed', false);

          const { data: memberships } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', profile.id)
            .eq('status', 'active');

          const totalBookings = bookings?.length || 0;
          const totalSpent = bookings?.reduce((sum, booking) => sum + booking.price_amount, 0) || 0;

          return {
            ...profile,
            email: bookings?.[0]?.customer_email || '',
            total_bookings: totalBookings,
            total_spent: totalSpent,
            active_gift_cards: giftCards?.length || 0,
            active_memberships: memberships?.length || 0,
            bookings: bookings || [],
            gift_cards: giftCards || [],
            memberships: memberships || []
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Customer Management</h1>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(c => c.active_memberships > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Customer Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length > 0 
                  ? formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length)
                  : '£0.00'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <p className="text-muted-foreground">No customers found.</p>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{customer.full_name || 'No name'}</h3>
                        {customer.active_memberships > 0 && (
                          <Badge variant="secondary">Member</Badge>
                        )}
                        {customer.active_gift_cards > 0 && (
                          <Badge variant="outline">Gift Cards</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.total_bookings} bookings
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        {customer.active_gift_cards > 0 && (
                          <div className="flex items-center space-x-1">
                            <Gift className="h-3 w-3" />
                            <span>{customer.active_gift_cards}</span>
                          </div>
                        )}
                        {customer.active_memberships > 0 && (
                          <div className="flex items-center space-x-1">
                            <CreditCard className="h-3 w-3" />
                            <span>{customer.active_memberships}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerDetailOpen(true);
                        }}
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

        {/* Customer Detail Modal */}
        <Dialog open={customerDetailOpen} onOpenChange={setCustomerDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Customer Details: {selectedCustomer?.full_name || 'No name'}</span>
                <Button variant="ghost" size="sm" onClick={() => setCustomerDetailOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.full_name || 'Not provided'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'Not provided'}</div>
                      <div><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</div>
                      <div><strong>Member since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Total Bookings:</strong> {selectedCustomer.total_bookings}</div>
                      <div><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.total_spent)}</div>
                      <div><strong>Active Gift Cards:</strong> {selectedCustomer.active_gift_cards}</div>
                      <div><strong>Active Memberships:</strong> {selectedCustomer.active_memberships}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Booking History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Booking History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCustomer.bookings.map((booking: any) => (
                          <div key={booking.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{booking.service_type}</span>
                              <span className="text-muted-foreground ml-2">
                                {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                              </span>
                            </div>
                            <div className="text-right">
                              <div>{formatCurrency(booking.price_amount)}</div>
                              <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {booking.payment_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No bookings found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Gift Cards */}
                {selectedCustomer.gift_cards && selectedCustomer.gift_cards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gift Cards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCustomer.gift_cards.map((card: any) => (
                          <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-mono">{card.gift_code}</span>
                              <span className="text-muted-foreground ml-2">
                                {formatCurrency(card.amount)}
                              </span>
                            </div>
                            <Badge variant={card.is_redeemed ? 'secondary' : 'default'}>
                              {card.is_redeemed ? 'Redeemed' : 'Active'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Memberships */}
                {selectedCustomer.memberships && selectedCustomer.memberships.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Memberships</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCustomer.memberships.map((membership: any) => (
                          <div key={membership.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{membership.membership_type}</span>
                              <span className="text-muted-foreground ml-2">
                                {membership.sessions_remaining} sessions remaining
                              </span>
                            </div>
                            <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                              {membership.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}