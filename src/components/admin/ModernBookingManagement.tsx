import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  PoundSterling, 
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { EnhancedCreateBookingDialog } from '@/components/admin/EnhancedCreateBookingDialog';
import { EditBookingDialog } from '@/components/admin/EditBookingDialog';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { formatGBP } from '@/lib/format';

type Booking = Tables<'bookings'>;

interface BookingStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingPayments: number;
}

export default function ModernBookingManagement() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      await fetchBookings();
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleVerifyPayment = async (bookingId: string) => {
    setVerifyingPayment(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: { bookingId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Verified",
          description: data.message,
        });
        await fetchBookings();
      } else {
        toast({
          title: "Payment Not Confirmed",
          description: data.message,
          variant: data.status === 'unpaid' ? 'destructive' : 'default',
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify payment status",
        variant: "destructive",
      });
    } finally {
      setVerifyingPayment(null);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('session_date', { ascending: false });

      if (error) throw error;

      setBookings(bookingsData || []);

      const totalBookings = bookingsData?.length || 0;
      const upcomingBookings = (bookingsData || []).filter(b => 
        new Date(b.session_date) >= new Date() && b.payment_status !== 'cancelled'
      ).length;
      const completedBookings = (bookingsData || []).filter(b => 
        b.payment_status === 'paid' && new Date(b.session_date) < new Date()
      ).length;
      const totalRevenue = (bookingsData || [])
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.price_amount, 0);
      const pendingPayments = (bookingsData || []).filter(b => 
        b.payment_status === 'pending'
      ).length;

      setStats({
        totalBookings: bookingsData?.length || 0,
        upcomingBookings,
        completedBookings,
        totalRevenue,
        pendingPayments
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = formatGBP;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Get pending bookings with Stripe sessions (possible webhook failures)
  const pendingWithStripe = bookings.filter(b => 
    b.payment_status === 'pending' && b.stripe_session_id
  );

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: AlertTriangle,
      color: stats.pendingPayments > 0 ? 'text-yellow-600' : 'text-gray-600',
      bgColor: stats.pendingPayments > 0 ? 'bg-yellow-50' : 'bg-gray-50'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: PoundSterling,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Bookings"
            description="Create, edit and manage customer bookings."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16"></div>
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
        <AdminPageHeader
          title="Bookings"
          description="Create, edit and manage customer bookings."
          right={
            <Button onClick={() => setCreateOpen(true)} className="min-h-[44px]">
              <Calendar className="h-4 w-4 mr-2" />
              Create booking
            </Button>
          }
        />

        <EnhancedCreateBookingDialog open={createOpen} onOpenChange={setCreateOpen} />

        {selectedBooking && (
          <EditBookingDialog
            booking={{
              id: selectedBooking.id,
              customer_name: selectedBooking.customer_name,
              customer_email: selectedBooking.customer_email,
              customer_phone: selectedBooking.customer_phone || undefined,
              guest_count: selectedBooking.guest_count || 1,
              session_date: selectedBooking.session_date,
              session_time: selectedBooking.session_time,
              payment_status: selectedBooking.payment_status || 'pending',
              special_requests: selectedBooking.special_requests || undefined,
              stripe_session_id: selectedBooking.stripe_session_id || undefined,
              price_amount: selectedBooking.price_amount,
              final_amount: selectedBooking.final_amount || undefined,
              time_slot_id: selectedBooking.time_slot_id || undefined,
              booking_type: selectedBooking.booking_type || 'communal',
            }}
            open={editOpen}
            onOpenChange={setEditOpen}
            onBookingUpdated={fetchBookings}
          />
        )}

        {/* Pending Payments Warning Banner */}
        {pendingWithStripe.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    {pendingWithStripe.length} Pending Booking{pendingWithStripe.length > 1 ? 's' : ''} May Need Attention
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    These bookings have Stripe sessions but are still marked as pending. This could mean:
                  </p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside mb-3 space-y-1">
                    <li>The customer abandoned checkout</li>
                    <li>The payment webhook failed to update the booking</li>
                  </ul>
                  <p className="text-sm text-yellow-700">
                    Use the <strong>"Verify Payment"</strong> button on each booking to check if payment was actually completed in Stripe.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => setStatusFilter('pending')}
                >
                  Show Pending Only
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`${stat.bgColor} border-0`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search bookings by customer name, email, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">
                      Pending {stats.pendingPayments > 0 && `(${stats.pendingPayments})`}
                    </SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Confirmed
                  </Button>
                  <Button variant="outline" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Bookings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings found matching your criteria.</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 ${
                    booking.payment_status === 'pending' && booking.stripe_session_id 
                      ? 'border-yellow-300 bg-yellow-50/50' 
                      : ''
                  }`}>
                    <Checkbox
                      checked={selectedBookings.includes(booking.id)}
                      onCheckedChange={() => handleSelectBooking(booking.id)}
                    />
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {booking.customer_email}
                        </div>
                        {booking.customer_phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {booking.customer_phone}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">{booking.service_type}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.session_date)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {booking.session_time}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium">{formatCurrency(booking.price_amount)}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getPaymentStatusColor(booking.payment_status)}`}>
                            {booking.payment_status || 'pending'}
                          </Badge>
                          {booking.payment_status === 'pending' && booking.stripe_session_id && (
                            <span className="text-xs text-yellow-600" title="Has Stripe session - may need verification">
                              ⚠️
                            </span>
                          )}
                        </div>
                        {booking.stripe_session_id && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[180px]" title={booking.stripe_session_id}>
                            Stripe: {booking.stripe_session_id.slice(0, 20)}...
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Verify Payment Button for pending bookings with Stripe sessions */}
                        {booking.payment_status === 'pending' && booking.stripe_session_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                            onClick={() => handleVerifyPayment(booking.id)}
                            disabled={verifyingPayment === booking.id}
                          >
                            {verifyingPayment === booking.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Verify
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedBooking.customer_name}</p>
                                    <p><strong>Email:</strong> {selectedBooking.customer_email}</p>
                                    {selectedBooking.customer_phone && (
                                      <p><strong>Phone:</strong> {selectedBooking.customer_phone}</p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Booking Information</h4>
                                    <p><strong>Service:</strong> {selectedBooking.service_type}</p>
                                    <p><strong>Date:</strong> {formatDate(selectedBooking.session_date)}</p>
                                    <p><strong>Time:</strong> {selectedBooking.session_time}</p>
                                    <p><strong>Price:</strong> {formatCurrency(selectedBooking.price_amount)}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Payment Status</h4>
                                  <Badge className={getPaymentStatusColor(selectedBooking.payment_status)}>
                                    {selectedBooking.payment_status || 'pending'}
                                  </Badge>
                                  {selectedBooking.stripe_session_id && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Stripe Session: {selectedBooking.stripe_session_id}
                                    </p>
                                  )}
                                </div>
                                {selectedBooking.special_requests && (
                                  <div>
                                    <h4 className="font-medium mb-2">Special Requests</h4>
                                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                      {selectedBooking.special_requests}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium mb-2">Booking Created</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(selectedBooking.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
