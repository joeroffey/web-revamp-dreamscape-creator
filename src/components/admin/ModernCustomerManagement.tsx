import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Eye, Phone, Mail, Calendar, DollarSign, Filter, TrendingUp, Star } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  customer_type: string;
  tags: string[];
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

export default function ModernCustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [filterByType, setFilterByType] = useState<string>("all");
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);

  // Derive customers from bookings table
  const { data: customers, isLoading } = useQuery({
    queryKey: ["modern-customers"],
    queryFn: async () => {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select('customer_email, customer_name, customer_phone, price_amount, payment_status, session_date, booking_status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by email
      const customerMap = new Map<string, {
        full_name: string | null;
        email: string;
        phone: string | null;
        total_bookings: number;
        total_spent: number;
        last_booking_date: string | null;
      }>();

      (bookingData || []).forEach((booking) => {
        const email = booking.customer_email;
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            full_name: booking.customer_name,
            email,
            phone: booking.customer_phone,
            total_bookings: 0,
            total_spent: 0,
            last_booking_date: null,
          });
        }
        const c = customerMap.get(email)!;
        c.total_bookings += 1;
        if (booking.payment_status === 'paid') {
          c.total_spent += booking.price_amount;
        }
        if (!c.last_booking_date || new Date(booking.session_date) > new Date(c.last_booking_date)) {
          c.last_booking_date = booking.session_date;
        }
      });

      const result: Customer[] = Array.from(customerMap.entries()).map(([email, data]) => {
        let customer_type = 'new';
        let tags: string[] = ['New Customer'];
        
        if (data.total_spent > 50000) { // > £500
          customer_type = 'vip';
          tags = ['VIP', 'High Value'];
        } else if (data.total_bookings >= 5) {
          customer_type = 'regular';
          tags = ['Regular'];
        }

        return {
          id: email,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          total_bookings: data.total_bookings,
          total_spent: data.total_spent,
          last_booking_date: data.last_booking_date,
          customer_type,
          tags,
        };
      });

      return result;
    },
  });

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
    setShowCustomerDetails(true);
    await fetchCustomerBookings(customer.email);
  };

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    
    const matchesType = filterByType === "all" || customer.customer_type === filterByType;
    
    return matchesSearch && matchesType;
  }) || [];

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          </div>
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

  const vipCustomers = customers?.filter(c => c.customer_type === 'vip').length || 0;
  const totalRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;
  const avgBookingsPerCustomer = customers?.length ? Math.round(customers.reduce((sum, c) => sum + c.total_bookings, 0) / customers.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Customer Management
              </h1>
              <p className="text-gray-600 text-sm">Manage your customer relationships and insights</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 shadow-md bg-white/80 backdrop-blur-sm"
            />
          </div>
          
          <Select value={filterByType} onValueChange={setFilterByType}>
            <SelectTrigger className="w-40 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers?.length || 0}</div>
              <p className="text-xs text-blue-100 mt-1">Active customer base</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Star className="h-4 w-4" />
                VIP Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{vipCustomers}</div>
              <p className="text-xs text-purple-100 mt-1">High-value customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-green-100 mt-1">From paid bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgBookingsPerCustomer}</div>
              <p className="text-xs text-orange-100 mt-1">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm">Customers will appear here after they make bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer bg-white"
                    onClick={() => openCustomerDialog(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {customer.full_name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{customer.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                            {customer.phone && (
                              <>
                                <Phone className="h-3 w-3 ml-2" />
                                {customer.phone}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(customer.total_spent)}</div>
                          <div className="text-sm text-muted-foreground">{customer.total_bookings} bookings</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.map((tag, i) => (
                            <Badge key={i} variant={customer.customer_type === 'vip' ? 'default' : 'secondary'} className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Details
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 p-1">
                  {/* Customer Info */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                      {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedCustomer.full_name || 'No name'}</h3>
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedCustomer.email}
                      </div>
                      {selectedCustomer.phone && (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedCustomer.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedCustomer.total_bookings}</div>
                      <div className="text-sm text-muted-foreground">Total Bookings</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold">{formatCurrency(selectedCustomer.total_spent)}</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold capitalize">{selectedCustomer.customer_type}</div>
                      <div className="text-sm text-muted-foreground">Customer Type</div>
                    </Card>
                  </div>

                  {/* Booking History */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Booking History
                    </h4>
                    {customerBookings.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No bookings found</p>
                    ) : (
                      <div className="space-y-2">
                        {customerBookings.map((booking) => (
                          <div key={booking.id} className="p-3 border rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-medium">{formatServiceType(booking.service_type)}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(booking.session_date), 'PPP')} at {booking.session_time}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(booking.price_amount)}</div>
                              <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {booking.payment_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
