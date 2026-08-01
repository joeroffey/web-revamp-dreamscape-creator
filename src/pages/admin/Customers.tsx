import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, Phone, Calendar, CreditCard, Eye, CalendarDays, SortAscending, SortDescending } from 'lucide-react';
import { format } from 'date-fns';

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

  // Filter and sort state
  const [filterType, setFilterType] = useState<'all' | 'new' | 'regular' | 'vip'>('all');
  const [sortBy, setSortBy] = useSessionStorage('customer-sort-by', 'last_booking_date'); // default sort
  const [sortDirection, setSortDirection] = useSessionStorage('customer-sort-direction', 'desc'); // default direction
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minSpent, setMinSpent] = useState<number>(0);
  const [maxSpent, setMaxSpent] = useState<number>(10000); // reasonable max

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
        const customerMap = new Map<string, Customer & { visits: number }>();

        bookingData.forEach(booking => {
          const email = booking.customer_email;
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              id: email,
              full_name: booking.customer_name,
              email: email,
              phone: booking.customer_phone,
              total_bookings: 0,
              total_spent: 0,
              last_booking_date: null,
              membership_status: null,
              visits: 0 // temporary for filtering
            });
          }

          const customer = customerMap.get(email)!;
          customer.total_bookings += 1;
          customer.visits += 1;

          if (booking.payment_status === 'paid') {
            customer.total_spent += booking.price_amount;
          }

          if (!customer.last_booking_date || new Date(booking.session_date) > new Date(customer.last_booking_date)) {
            customer.last_booking_date = booking.session_date;
          }
        });

        // Convert to array and determine customer types
        const customerArray: Customer[] = Array.from(customerMap.values()).map(customer => {
          // Determine customer type based on spending and visits
          let type: 'new' | 'regular' | 'vip' = 'new';
          if (customer.total_spent > 500) {
            type = 'vip';
          } else if (customer.total_bookings >= 5) {
            type = 'regular';
          }

          // Remove the temporary visits property
          const { visits, ...cleanCustomer } = customer as any;
          return {
            ...cleanCustomer,
            // We could store customer type in the customer object if we wanted to persist it
            // but for now we'll calculate it on the fly for filtering
          } as Customer;
        });

        setCustomers(customerArray);
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

  // Filter customers based on all criteria
  const filteredCustomers = customers.filter(customer => {
    // Text search
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Date range filter
    if (dateFrom || dateTo) {
      const lastVisit = customer.last_booking_date ? new Date(customer.last_booking_date) : null;
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && lastVisit && lastVisit < fromDate) return false;
      if (toDate && lastVisit && lastVisit > toDate) return false;
      if ((!fromDate || !toDate) && lastVisit === null) return false; // if filtering by date but customer has no visits
    }

    // Spending range filter
    if (customer.total_spent < minSpent || customer.total_spent > maxSpent) {
      return false;
    }

    // Customer type filter (calculated on the fly)
    if (filterType !== 'all') {
      let isVip = false;
      let isRegular = false;
      let isNew = false;

      if (customer.total_spent > 500) isVip = true;
      else if (customer.total_bookings >= 5) isRegular = true;
      else isNew = true;

      if (filterType === 'vip' && !isVip) return false;
      if (filterType === 'regular' && !isRegular) return false;
      if (filterType === 'new' && !isNew) return false;
    }

    return true;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'total_spent':
        comparison = a.total_spent - b.total_spent;
        break;
      case 'total_bookings':
        comparison = a.total_bookings - b.total_bookings;
        break;
      case 'last_booking_date':
        const dateA = a.last_booking_date ? new Date(a.last_booking_date).getTime() : 0;
        const dateB = b.last_booking_date ? new Date(b.last_booking_date).getTime() : 0;
        comparison = dateB - dateA; // descending by default for dates (newest first)
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    return format(new Date(dateStr), 'PPP');
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
          <h1 className="text-2xl md:text-3xl font-flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Customer Management
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset filters
                setSearchTerm('');
                setFilterType('all');
                setSortBy('last_booking_date');
                setSortDirection('desc');
                setDateFrom('');
                setDateTo('');
                setMinSpent(0);
                setMaxSpent(10000);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filters & Sorting</span>
              <Button variant="outline" size="sm" onClick={() => {
                // Toggle filter visibility - we'd need state for this
                // For now, just reset
              }}>
                <Filter className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Customers</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTarget(e.target.value)}
              />
            </div>

            {/* Row 1: Type filter and Date range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="regular">Regular Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visit Date Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                }
              </div>
            </div>

            {/* Row 2: Spending range and Sort by */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spendingRange">Total Spend Range (£)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minSpent">Min</Label>
                    <Input
                      id="minSpent"
                      type="number"
                      min="0"
                      step="1"
                      value={minSpent}
                      onChange={(e) => setMinSpent(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSpent">Max</Label>
                    <Input
                      id="maxSpent"
                      type="number"
                      min="0"
                      step="1"
                      value={maxSpent}
                      onChange={(e) => setMaxSpent(parseInt(e.target.value) || 10000)}
                    />
                  </div>
                }
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOptions">Sort By</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="total_spent">Total Spend</SelectItem>
                      <SelectItem value="total_bookings">Total Bookings</SelectItem>
                      <SelectItem value="last_booking_date">Last Visit Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortDirection} onValueChange={setSortDirection} className="w-20">
                    <SelectTrigger>
                      <SelectValue>{sortDirection.toUpperCase()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{sortedCustomers.length}</div>
              <p className="text-xs text-blue-600 mt-1">After filters</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                VIP Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {sortedCustomers.filter(c => c.total_spent > 500).length}
              </div>
              <p className="text-xs text-purple-600 mt-1">Spend > £500</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(sortedCustomers.reduce((sum, c) => sum + c.total_spent, 0))}
              </div>
              <p className="text-xs text-green-600 mt-1">From filtered customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Avg. Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {sortedCustomers.length > 0 ? Math.round(sortedCustomers.reduce((sum, c) => sum + c.total_bookings, 0) / sortedCustomers.length) : 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customers ({sortedCustomers.length})</span>
              <Button variant="outline" size="sm" onClick={() => {
                // This would typically open a bulk actions menu
                // For now, we'll just show a toast
                toast({
                  title: "Bulk Actions",
                  description: "Bulk actions functionality coming soon",
                });
              }}>
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers match the current filters.</p>
                <div className="text-xs text-muted-foreground mt-4">
                  Try adjusting your search or filter criteria above.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{customer.full_name || "No name"}</h3>
                        {(() => {
                          if (customer.total_spent > 500) {
                            return <Badge variant="destructive" className="text-xs">VIP</Badge>;
                          }
                          if (customer.total_bookings >= 5) {
                            return <Badge variant="secondary" className="text-xs">Regular</Badge>;
                          }
                          return <Badge variant="default" className="text-xs">New</Badge>;
                        })()}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mt-1 gap-4">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="break-all">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(customer.last_booking_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PoundSterling className="h-3 w-3" />
                          <span>{formatCurrency(customer.total_spent)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{customer.total_bookings} visit{(customer.total_bookings !== 1 ? 's' : '')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCustomerDialog(customer)}
                          className="hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Modal */}
        <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Details
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.full_name || 'No name provided'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email}</div>
                      <div><strong>Phone:</strong> {selectedCustomer.phone || 'No phone provided'}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Total Bookings:</strong> {selectedCustomer.total_bookings}</div>
                      <div><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.total_spent)}</div>
                      <div><strong>Average per Booking:</strong> {selectedCustomer.total_bookings ? formatCurrency(selectedCustomer.total_spent / selectedCustomer.total_bookings) : "£0.00"}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Visit History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerBookings.length === 0 ? (
                      <p className="text-muted-foreground">No bookings found.</p>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {customerBookings.map((booking) => (
                            <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded gap-2">
                              <div>
                                <p className="font-medium">{booking.service_type.replace('_', ' ')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time.slice(0, 5)}
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
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Custom hook for session storage state
function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      setStoredValue(value);
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}