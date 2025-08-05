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
import { Users, Search, Eye, Phone, Mail, Calendar, DollarSign, MessageSquare, Tag, Filter, TrendingUp, Star } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  membership_status: string | null;
  customer_type?: string;
  tags?: string[];
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

  const { data: customers, isLoading } = useQuery({
    queryKey: ["modern-customers"],
    queryFn: async () => {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_email, customer_name, customer_phone, price_amount, payment_status, session_date, service_type, booking_status')
        .order('created_at', { ascending: false });

      if (bookingData) {
        const customerMap = new Map();
        
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
              customer_type: 'regular',
              tags: []
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

          if (customer.total_spent > 50000) {
            customer.customer_type = 'vip';
            customer.tags = ['VIP', 'High Value', 'Premium'];
          } else if (customer.total_bookings >= 5) {
            customer.customer_type = 'regular';
            customer.tags = ['Regular', 'Frequent Visitor'];
          } else {
            customer.customer_type = 'new';
            customer.tags = ['New Customer'];
          }
        });

        return Array.from(customerMap.values());
      }
      return [];
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
  const newCustomers = customers?.filter(c => c.customer_type === 'new').length || 0;
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
              <p className="text-xs text-green-100 mt-1">From all customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgBookingsPerCustomer}</div>
              <p className="text-xs text-orange-100 mt-1">Per customer</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold">Customers ({filteredCustomers.length})</span>
              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                {newCustomers} new this month
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No customers found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-blue-200 bg-white/60 backdrop-blur-sm gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {customer.full_name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{customer.full_name || "No name"}</h3>
                          {customer.customer_type && customer.customer_type !== 'regular' && (
                            <Badge 
                              variant={customer.customer_type === 'vip' ? 'default' : 'secondary'} 
                              className={`text-xs ${customer.customer_type === 'vip' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}`}
                            >
                              {customer.customer_type.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 gap-6">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="break-all">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {customer.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                              {tag}
                            </Badge>
                          ))}
                          {customer.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                              +{customer.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(customer.total_spent)}
                      </div>
                      {customer.last_booking_date && (
                        <div className="text-xs text-gray-500 mb-3">
                          Last: {new Date(customer.last_booking_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerDialog(customer)}
                        className="group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                      <div><strong>Customer Type:</strong> {selectedCustomer.customer_type || "Regular"}</div>
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
                      <div><strong>Customer Since:</strong> {selectedCustomer.last_booking_date ? format(new Date(selectedCustomer.last_booking_date), "MMM yyyy") : "Unknown"}</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Booking History ({customerBookings.length})</CardTitle>
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
                                <p className="font-medium">{formatServiceType(booking.service_type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                                  {booking.payment_status}
                                </Badge>
                                <Badge variant={booking.booking_status === 'completed' ? 'secondary' : 'outline'}>
                                  {booking.booking_status}
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
