import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Eye, Phone, Mail, Calendar, DollarSign, MessageSquare, Tag, Filter, TrendingUp, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatGBP } from "@/lib/format";

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  notes?: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  membership_status: string | null;
  customer_type?: string;
  tags?: string[];
  isDerived?: boolean;
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
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ full_name: "", email: "", phone: "", notes: "", tags: "" });

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["modern-customers"],
    queryFn: async () => {
      // Load CRM customers (Admin-managed) and enrich with booking metrics.
      const [{ data: customerRows }, { data: bookingData }] = await Promise.all([
        supabase.from('customers').select('id, full_name, email, phone, notes, tags').order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('customer_email, customer_name, customer_phone, price_amount, payment_status, session_date, booking_status')
          .order('created_at', { ascending: false })
      ]);

      const metrics = new Map<string, { total_bookings: number; total_spent: number; last_booking_date: string | null }>();
      (bookingData || []).forEach((booking) => {
        const email = booking.customer_email;
        if (!metrics.has(email)) {
          metrics.set(email, { total_bookings: 0, total_spent: 0, last_booking_date: null });
        }
        const m = metrics.get(email)!;
        m.total_bookings += 1;
        if (booking.payment_status === 'paid') m.total_spent += booking.price_amount;
        if (!m.last_booking_date || new Date(booking.session_date) > new Date(m.last_booking_date)) {
          m.last_booking_date = booking.session_date;
        }
      });

      // Derive customers from bookings (useful for guest bookings or before CRM rows exist).
      const derivedMap = new Map<string, Customer>();
      (bookingData || []).forEach((booking) => {
        const email = booking.customer_email;
        if (!email) return;
        if (!derivedMap.has(email)) {
          derivedMap.set(email, {
            id: `derived:${email}`,
            full_name: booking.customer_name,
            email,
            phone: booking.customer_phone,
            total_bookings: 0,
            total_spent: 0,
            last_booking_date: null,
            membership_status: null,
            customer_type: 'new',
            tags: ['New Customer'],
            isDerived: true,
          });
        }
      });

      const baseCustomers: Customer[] = (customerRows || []).map((c) => {
        const m = metrics.get(c.email) || { total_bookings: 0, total_spent: 0, last_booking_date: null };
        let customer_type: string = 'new';
        let tags: string[] = (c.tags as any) || [];
        if (m.total_spent > 50000) {
          customer_type = 'vip';
          tags = tags.length ? tags : ['VIP', 'High Value'];
        } else if (m.total_bookings >= 5) {
          customer_type = 'regular';
          tags = tags.length ? tags : ['Regular'];
        } else {
          customer_type = 'new';
          tags = tags.length ? tags : ['New Customer'];
        }
        return {
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          notes: (c as any).notes,
          total_bookings: m.total_bookings,
          total_spent: m.total_spent,
          last_booking_date: m.last_booking_date,
          membership_status: null,
          customer_type,
          tags,
        };
      });

      // Union: CRM customers + derived customers for emails not yet in CRM.
      const emailsInCrm = new Set(baseCustomers.map(c => c.email));
      const derivedCustomers = Array.from(derivedMap.values())
        .filter(c => !emailsInCrm.has(c.email))
        .map((c) => {
          const m = metrics.get(c.email) || { total_bookings: 0, total_spent: 0, last_booking_date: null };
          return { ...c, total_bookings: m.total_bookings, total_spent: m.total_spent, last_booking_date: m.last_booking_date };
        });

      return [...baseCustomers, ...derivedCustomers];
    },
  });

  const resetCustomerForm = () => setCustomerForm({ full_name: "", email: "", phone: "", notes: "", tags: "" });

  const openCreateCustomer = () => {
    resetCustomerForm();
    setCreateCustomerOpen(true);
  };

  const openEditCustomer = (customer: Customer) => {
    // Derived customers come from bookings; "editing" should promote them into the CRM.
    if (customer.isDerived) {
      setCustomerForm({
        full_name: customer.full_name || "",
        email: customer.email,
        phone: customer.phone || "",
        notes: customer.notes || "",
        tags: (customer.tags || []).join(", "),
      });
      setSelectedCustomer(null);
      setCreateCustomerOpen(true);
      toast.info('This customer was derived from bookings. Save to add them to the CRM.');
      return;
    }
    setCustomerForm({
      full_name: customer.full_name || "",
      email: customer.email,
      phone: customer.phone || "",
      notes: customer.notes || "",
      tags: (customer.tags || []).join(", "),
    });
    setSelectedCustomer(customer);
    setEditCustomerOpen(true);
  };

  const saveCustomer = async (mode: 'create' | 'edit') => {
    try {
      if (!customerForm.email.trim()) {
        toast.error('Email is required');
        return;
      }

      const payload = {
        full_name: customerForm.full_name || null,
        email: customerForm.email.trim().toLowerCase(),
        phone: customerForm.phone || null,
        notes: customerForm.notes || null,
        tags: customerForm.tags
          ? customerForm.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
      };

      const { error } = mode === 'create'
        ? await supabase.from('customers').insert(payload)
        : await supabase.from('customers').update(payload).eq('id', selectedCustomer?.id);

      if (error) throw error;

      toast.success(mode === 'create' ? 'Customer created' : 'Customer updated');
      queryClient.invalidateQueries({ queryKey: ['modern-customers'] });
      setCreateCustomerOpen(false);
      setEditCustomerOpen(false);
      resetCustomerForm();
    } catch (e: any) {
      console.error('Customer save error:', e);
      toast.error(e?.message || 'Failed to save customer');
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
    return formatGBP(amount);
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

  const newCustomers = customers?.filter(c => c.customer_type === 'new').length || 0;
  const totalRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;
  const avgBookingsPerCustomer = customers?.length ? Math.round(customers.reduce((sum, c) => sum + c.total_bookings, 0) / customers.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Customers"
          description="Manage customers, view booking history, and track spend."
          right={
            <Button onClick={openCreateCustomer} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Create customer
            </Button>
          }
        />

        <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input value={customerForm.full_name} onChange={(e) => setCustomerForm(prev => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={customerForm.tags} onChange={(e) => setCustomerForm(prev => ({ ...prev, tags: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>Cancel</Button>
                <Button onClick={() => saveCustomer('create')}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editCustomerOpen} onOpenChange={setEditCustomerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input value={customerForm.full_name} onChange={(e) => setCustomerForm(prev => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={customerForm.tags} onChange={(e) => setCustomerForm(prev => ({ ...prev, tags: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditCustomerOpen(false)}>Cancel</Button>
                <Button onClick={() => saveCustomer('edit')}>Save changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                <TrendingUp className="h-4 w-4" />
                New Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{newCustomers}</div>
              <p className="text-xs text-purple-100 mt-1">This month</p>
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
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCustomerDialog(customer)}
                          className="group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCustomer(customer)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
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
