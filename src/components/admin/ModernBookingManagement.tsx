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
import { 
  Calendar, 
  Users, 
  DollarSign, 
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
  MapPin
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
}

export default function ModernBookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
        new Date(b.session_date) >= new Date() && b.booking_status !== 'cancelled'
      ).length;
      const completedBookings = (bookingsData || []).filter(b => 
        b.booking_status === 'completed'
      ).length;
      const totalRevenue = (bookingsData || [])
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.price_amount, 0);

      setStats({
        totalBookings: bookingsData?.length || 0,
        upcomingBookings,
        completedBookings,
        totalRevenue
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

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
      title: 'Completed Bookings',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
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
              booking_status: selectedBooking.booking_status || 'confirmed',
              payment_status: selectedBooking.payment_status || 'pending',
              special_requests: selectedBooking.special_requests || undefined,
            }}
            open={editOpen}
            onOpenChange={setEditOpen}
            onBookingUpdated={fetchBookings}
          />
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
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
                  <div key={booking.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
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
                        <Badge className={`text-xs ${getPaymentStatusColor(booking.payment_status)}`}>
                          {booking.payment_status || 'pending'}
                        </Badge>
                        <br />
                        <Badge className={`text-xs mt-1 ${getStatusColor(booking.booking_status)}`}>
                          {booking.booking_status || 'pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
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
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Status</h4>
                                    <Badge className={getStatusColor(selectedBooking.booking_status)}>
                                      {selectedBooking.booking_status || 'pending'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Payment Status</h4>
                                    <Badge className={getPaymentStatusColor(selectedBooking.payment_status)}>
                                      {selectedBooking.payment_status || 'pending'}
                                    </Badge>
                                  </div>
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
