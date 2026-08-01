import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, PoundSterling, Users, Filter, Eye, X, CalendarDays, SortAscending, SortDescending } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, addDays, isToday, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSessionStorage } from '@/hooks/use-session-storage';

interface Booking {
  id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  price_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_type: string;
  payment_status: string;
  booking_status: string;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

  // Filter and sort state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000); // £500 max
  const [sortBy, setSortBy] = useSessionStorage('bookings-sort-by', 'session_date'); // default sort
  const [sortDirection, setSortDirection] = useSessionStorage('bookings-sort-direction', 'desc'); // default direction (newest first)

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on all criteria
  const filteredBookings = bookings.filter(booking => {
    // Text search
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_type.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && booking.booking_status !== statusFilter) {
      return false;
    }

    // Payment filter
    if (paymentFilter !== 'all' && booking.payment_status !== paymentFilter) {
      return false;
    }

    // Service type filter
    if (serviceTypeFilter !== 'all' && booking.service_type !== serviceTypeFilter) {
      return false;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const bookingDate = new Date(booking.session_date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && bookingDate < fromDate) return false;
      if (toDate && bookingDate > toDate) return false;
    }

    // Price range filter
    const priceInPounds = booking.price_amount / 100;
    if (priceInPounds < minPrice || priceInPounds > maxPrice) {
      return false;
    }

    return true;
  });

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.session_date).getTime() - new Date(b.session_date).getTime();
        break;
      case 'time':
        comparison = a.session_time.localeCompare(b.session_time);
        break;
      case 'customer_name':
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case 'customer_email':
        comparison = a.customer_email.localeCompare(b.customer_email);
        break;
      case 'service_type':
        comparison = a.service_type.localeCompare(b.service_type);
        break;
      case 'price':
        comparison = a.price_amount - b.price_amount;
        break;
      case 'duration':
        comparison = a.duration_minutes - b.duration_minutes;
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId ? { ...booking, booking_status: status } : booking
        )
      );
      toast.success('Booking status updated');
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'cancelled': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  // Get unique service types for filter dropdown
  const serviceTypes = [...new Set(bookings.map(b => b.service_type))].sort();

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Booking Management</h1>
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
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b =>
                  new Date(b.session_date) >= new Date() && b.booking_status === 'confirmed'
                ).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <PoundSterling className="h-4 w-4 mr-2" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  bookings
                    .filter(b => b.payment_status === 'paid')
                    .reduce((sum, b) => sum + b.price_amount, 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Confirmed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b =>
                  new Date(b.session_date).toDateString() === new Date().toDateString() &&
                  b.booking_status === 'confirmed'
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filters & Sorting</span>
              <Button variant="outline" size="sm" onClick={() => {
                // Reset filters
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setServiceTypeFilter('all');
                setDateFrom('');
                setDateTo('');
                setMinPrice(0);
                setMaxPrice(50000);
                setSortBy('session_date');
                setSortDirection('desc');
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Bookings</Label>
              <Input
                id="search"
                placeholder="Search by customer name, email, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Row 1: Status, Payment, Service Type filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statusFilter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentFilter">Payment Status</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceTypeFilter">Service Type</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Date range and Price range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
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
              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range (£)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Min</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={minPrice}
                      onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value) || 50000)}
                    />
                  </div>
                }
              </div>
            </div>

            {/* Row 3: Sort options */}
            <div className="space-y-2">
              <Label htmlFor="sortOptions">Sort By</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session_date">Date</SelectItem>
                    <SelectItem value="session_time">Time</SelectItem>
                    <SelectItem value="customer_name">Customer Name</SelectItem>
                    <SelectItem value="customer_email">Customer Email</SelectItem>
                    <SelectItem value="service_type">Service Type</SelectItem>
                    <SelectItem value="price_amount">Price</SelectItem>
                    <SelectItem value="duration_minutes">Duration</SelectItem>
                    <SelectItem value="created_at">Created At</SelectItem>
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
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bookings ({sortedBookings.length})</span>
              <Button variant="outline" size="sm" onClick={() => {
                // This would typically open a bulk actions menu
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
            {sortedBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings match the current filters.</p>
                <div className="text-xs text-muted-foreground mt-4">
                  Try adjusting your search or filter criteria above.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                        <Badge variant={getStatusBadgeVariant(booking.booking_status)}>
                          {booking.booking_status}
                        </Badge>
                        <Badge variant={getPaymentBadgeVariant(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mt-1 gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(booking.session_date)} at {formatTime(booking.session_time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{booking.customer_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>{booking.service_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{booking.duration_minutes} min</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <PoundSterling className="h-3 w-3" />
                          <span>{formatCurrency(booking.price_amount)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(booking.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingDetailOpen(true);
                          }}
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

        {/* Booking Detail Modal */}
        <Dialog open={bookingDetailOpen} onOpenChange={setBookingDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <Button variant="ghost" size="sm" onClick={() => setBookingDetailOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Name:</strong> {selectedBooking.customer_name}</div>
                      <div><strong>Email:</strong> {selectedBooking.customer_email}</div>
                      <div><strong>Phone:</strong> {selectedBooking.customer_phone || 'Not provided'}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Booking Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Service:</strong> {selectedBooking.service_type.replace('_', ' ')}</div>
                      <div><strong>Date:</strong> {formatDate(selectedBooking.session_date)}</div>
                      <div><strong>Time:</strong> {formatTime(selectedBooking.session_time)}</div>
                      <div><strong>Duration:</strong> {selectedBooking.duration_minutes} minutes</div>
                      <div><strong>Price:</strong> {formatCurrency(selectedBooking.price_amount)}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <strong>Status:</strong>
                      <Badge variant={getStatusBadgeVariant(selectedBooking.booking_status)}>
                        {selectedBooking.booking_status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <strong>Payment:</strong>
                      <Badge variant={getPaymentBadgeVariant(selectedBooking.payment_status)}>
                        {selectedBooking.payment_status}
                      </Badge>
                    </div>
                    <div><strong>Booked:</strong> {new Date(selectedBooking.created_at).toLocaleString()}</div>
                    <div><strong>Last Updated:</strong> {new Date(selectedBooking.updated_at).toLocaleString()}</div>
                  </CardContent>
                </Card>

                {selectedBooking.special_requests && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Special Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedBooking.special_requests}</p>
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