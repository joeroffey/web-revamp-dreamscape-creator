
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, Phone, Calendar, CreditCard, Eye } from 'lucide-react';

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  membership_status: string | null;
}

interface CustomerBooking {
  id: string;
  session_date: string;
  session_time: string;
  service_type: string;
  price_amount: number;
  payment_status: string;
  booking_status: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // First get all unique customers from bookings
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_email, customer_name, customer_phone, price_amount, payment_status, session_date')
        .order('created_at', { ascending: false });

      if (bookingData) {
        // Group by email and calculate stats
        const customerMap = new Map();
        
        bookingData.forEach(booking => {
          const email = booking.customer_email;
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              id: email, // Using email as ID since we don't have proper customer IDs
              full_name: booking.customer_name,
              email: email,
              phone: booking.customer_phone,
              total_bookings: 0,
              total_spent: 0,
              last_booking_date: null,
              membership_status: null
            });
          }
          
          const customer = customerMap.get(email);
          customer.total_bookings += 1;
          
          if (booking.payment_status === 'paid') {
            customer.total_spent += booking.price_amount;
          }
          
          if (!customer.last_booking_date || new Date(booking.session_date) > new Date(customer.last_booking_date)) {
            customer.last_booking_date = booking.session_date;
          }
        });

        setCustomers(Array.from(customerMap.values()));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async (customerEmail: string) => {
    try {
      const { data } = await supabase
        .from('bookings')
        .select('id, session_date, session_time, service_type, price_amount, payment_status, booking_status')
        .eq('customer_email', customerEmail)
        .order('session_date', { ascending: false });

      setCustomerBookings(data || []);
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
    }
  };

  const openCustomerDialog = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
    await fetchCustomerBookings(customer.email);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const formatServiceType = (serviceType: string) => {
    switch (serviceType) {
      case 'ice_bath': return 'Ice Bath';
      case 'sauna': return 'Sauna';
      case 'combined': return 'Combined Session';
      default: return serviceType;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(c => c.last_booking_date && 
                  new Date(c.last_booking_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.total_bookings, 0) / customers.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.full_name || 'No name'}</span>
                        </div>
                        {customer.membership_status && (
                          <Badge variant="secondary">{customer.membership_status}</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span className="break-all">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{formatCurrency(customer.total_spent)} spent</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        {customer.last_booking_date && (
                          <div>Last: {new Date(customer.last_booking_date).toLocaleDateString()}</div>
                        )}
                      </div>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openCustomerDialog(customer)}
                            className="min-h-[44px]"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Customer Details</DialogTitle>
                          </DialogHeader>
                          {selectedCustomer && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="font-medium">Name</label>
                                  <p>{selectedCustomer.full_name || 'No name provided'}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Email</label>
                                  <p className="break-all">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Phone</label>
                                  <p>{selectedCustomer.phone || 'No phone provided'}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Total Spent</label>
                                  <p>{formatCurrency(selectedCustomer.total_spent)}</p>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-medium mb-4">Booking History ({customerBookings.length})</h3>
                                {customerBookings.length === 0 ? (
                                  <p className="text-muted-foreground">No bookings found.</p>
                                ) : (
                                  <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {customerBookings.map((booking) => (
                                      <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded gap-2">
                                        <div>
                                          <p className="font-medium">{formatServiceType(booking.service_type)}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                                            {booking.payment_status}
                                          </Badge>
                                          <span className="font-medium">{formatCurrency(booking.price_amount)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
