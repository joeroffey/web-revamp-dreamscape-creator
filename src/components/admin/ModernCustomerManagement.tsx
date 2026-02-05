import React, { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Search, Eye, Phone, Mail, Calendar, PoundSterling, TrendingUp, Plus, Pencil, Trash2, Upload, Download, MoreHorizontal, UserX, ArrowUpDown, ArrowUp, ArrowDown, UserPlus } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatGBP } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CustomerTokensSection } from "@/components/admin/CustomerTokensSection";

type SortField = 'name' | 'email' | 'bookings' | 'revenue' | 'last_booking';
type SortDirection = 'asc' | 'desc';

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
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [creatingAccounts, setCreatingAccounts] = useState(false);
  const { session } = useAuth();

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["modern-customers"],
    queryFn: async () => {
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
            tags: [],
            isDerived: true,
          });
        }
      });

      const baseCustomers: Customer[] = (customerRows || []).map((c) => {
        const m = metrics.get(c.email) || { total_bookings: 0, total_spent: 0, last_booking_date: null };
        let customer_type: string = 'new';
        const tags: string[] = (c.tags as any) || [];
        if (m.total_spent > 50000) {
          customer_type = 'vip';
        } else if (m.total_bookings >= 5) {
          customer_type = 'regular';
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

  const deleteCustomer = async (customer: Customer) => {
    if (customer.isDerived) {
      toast.error("Cannot delete a derived customer. They only exist in booking records.");
      return;
    }
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['modern-customers'] });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (e: any) {
      console.error('Delete error:', e);
      toast.error(e?.message || 'Failed to delete customer');
    }
  };

  const bulkDeleteCustomers = async () => {
    const crmCustomerIds = Array.from(selectedCustomers).filter(id => !id.startsWith('derived:'));
    if (crmCustomerIds.length === 0) {
      toast.error("No CRM customers selected to delete");
      setBulkDeleteDialogOpen(false);
      return;
    }
    try {
      const { error } = await supabase.from('customers').delete().in('id', crmCustomerIds);
      if (error) throw error;
      toast.success(`Deleted ${crmCustomerIds.length} customer(s)`);
      setSelectedCustomers(new Set());
      queryClient.invalidateQueries({ queryKey: ['modern-customers'] });
      setBulkDeleteDialogOpen(false);
    } catch (e: any) {
      console.error('Bulk delete error:', e);
      toast.error(e?.message || 'Failed to delete customers');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      // Handle Excel files using xlsx library
      try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          toast.error('File must have a header row and at least one data row');
          return;
        }

        // Column mapping: A=First Name, B=Last Name, C=Email, D=Phone
        const parsedData = jsonData.slice(1).map((row, idx) => {
          const firstName = String(row[0] || '').trim();
          const lastName = String(row[1] || '').trim();
          const email = String(row[2] || '').trim();
          const phone = String(row[3] || '').trim();
          const fullName = [firstName, lastName].filter(Boolean).join(' ');
          return {
            row: idx + 2,
            email,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            phone,
            valid: !!email && email.includes('@'),
          };
        }).filter(d => d.email);

        setImportData(parsedData);
        setImportDialogOpen(true);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Failed to parse Excel file');
      }
    } else {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast.error('CSV file must have a header row and at least one data row');
            return;
          }

          // Column mapping: A=First Name, B=Last Name, C=Email, D=Phone
          const parsedData = lines.slice(1).map((line, idx) => {
            const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const firstName = values[0] || '';
            const lastName = values[1] || '';
            const email = values[2] || '';
            const phone = values[3] || '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            return {
              row: idx + 2,
              email,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              phone,
              valid: !!email && email.includes('@'),
            };
          }).filter(d => d.email);

          setImportData(parsedData);
          setImportDialogOpen(true);
        } catch (err) {
          console.error('CSV parse error:', err);
          toast.error('Failed to parse CSV file');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importCustomers = async () => {
    const validData = importData.filter(d => d.valid);
    if (validData.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    try {
      const payload = validData.map(d => ({
        full_name: d.full_name || null,
        email: d.email.trim().toLowerCase(),
        phone: d.phone || null,
      }));

      const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'email' });
      if (error) throw error;

      toast.success(`Imported ${validData.length} customer(s)`);
      queryClient.invalidateQueries({ queryKey: ['modern-customers'] });
      setImportDialogOpen(false);
      setImportData([]);
    } catch (e: any) {
      console.error('Import error:', e);
      toast.error(e?.message || 'Failed to import customers');
    } finally {
      setImporting(false);
    }
  };

  const exportCustomers = () => {
    if (!customers || customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Tags', 'Total Bookings', 'Total Spent', 'Last Booking'];
    const rows = customers.map(c => [
      c.full_name || '',
      c.email,
      c.phone || '',
      (c.tags || []).join(';'),
      c.total_bookings,
      (c.total_spent / 100).toFixed(2),
      c.last_booking_date || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Customers exported');
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

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredCustomers) return;
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const filteredCustomers = useMemo(() => {
    let result = customers?.filter(customer => {
      const matchesSearch = customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);
      
      const matchesType = filterByType === "all" || customer.customer_type === filterByType;
      
      return matchesSearch && matchesType;
    }) || [];

    if (sortField) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = (a.full_name || '').localeCompare(b.full_name || '');
            break;
          case 'email':
            comparison = a.email.localeCompare(b.email);
            break;
          case 'bookings':
            comparison = a.total_bookings - b.total_bookings;
            break;
          case 'revenue':
            comparison = a.total_spent - b.total_spent;
            break;
          case 'last_booking':
            const dateA = a.last_booking_date ? new Date(a.last_booking_date).getTime() : 0;
            const dateB = b.last_booking_date ? new Date(b.last_booking_date).getTime() : 0;
            comparison = dateA - dateB;
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [customers, searchTerm, filterByType, sortField, sortDirection]);

  const formatCurrency = (amount: number) => formatGBP(amount);

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
  const crmSelectedCount = Array.from(selectedCustomers).filter(id => !id.startsWith('derived:')).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Customers"
          description="Manage customers, view booking history, and track spend."
          right={
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="min-h-[44px]">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportCustomers} className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={openCreateCustomer} className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          }
        />

        {/* Bulk Actions */}
        {selectedCustomers.size > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCustomers.size} customer(s) selected {crmSelectedCount < selectedCustomers.size && `(${selectedCustomers.size - crmSelectedCount} derived)`}
              </span>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} disabled={crmSelectedCount === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({crmSelectedCount})
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                New Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{newCustomers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Avg. Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgBookingsPerCustomer}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterByType} onValueChange={setFilterByType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customers ({filteredCustomers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('name')}
                        >
                          Customer
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('last_booking')}
                        >
                          Contact
                          {getSortIcon('last_booking')}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">Tags</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                          onClick={() => handleSort('bookings')}
                        >
                          Bookings
                          {getSortIcon('bookings')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                          onClick={() => handleSort('revenue')}
                        >
                          Revenue
                          {getSortIcon('revenue')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="group">
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.has(customer.id)}
                            onCheckedChange={() => toggleSelectCustomer(customer.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                              {customer.full_name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{customer.full_name || "No name"}</div>
                              <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                              {customer.isDerived && (
                                <Badge variant="outline" className="text-xs mt-1">From Bookings</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.last_booking_date && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Last: {format(new Date(customer.last_booking_date), 'dd MMM yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {customer.customer_type === 'vip' && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">VIP</Badge>
                            )}
                            {customer.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {(customer.tags?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">+{(customer.tags?.length || 0) - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{customer.total_bookings}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{formatCurrency(customer.total_spent)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openCustomerDialog(customer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditCustomer(customer)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!customer.isDerived && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Customer Dialog */}
        <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                <Input value={customerForm.tags} onChange={(e) => setCustomerForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="VIP, Regular, etc." />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>Cancel</Button>
              <Button onClick={() => saveCustomer('create')}>Save Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={editCustomerOpen} onOpenChange={setEditCustomerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCustomerOpen(false)}>Cancel</Button>
              <Button onClick={() => saveCustomer('edit')}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{customerToDelete?.full_name || customerToDelete?.email}</strong>? 
                This will remove them from the CRM but their booking history will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => customerToDelete && deleteCustomer(customerToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {crmSelectedCount} Customer(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the selected customers? Their booking history will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={bulkDeleteCustomers} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Import Customers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {importData.length} row(s) found. {importData.filter(d => d.valid).length} valid for import.
              </p>
              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row, idx) => (
                      <TableRow key={idx} className={!row.valid ? 'bg-destructive/10' : ''}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{row.full_name || '-'}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone || '-'}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="outline" className="text-green-600">Valid</Badge>
                          ) : (
                            <Badge variant="destructive">Invalid email</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button onClick={importCustomers} disabled={importing || importData.filter(d => d.valid).length === 0}>
                {importing ? 'Importing...' : `Import ${importData.filter(d => d.valid).length} Customer(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Details Dialog */}
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
                      <div><strong>Type:</strong> <Badge variant={selectedCustomer.customer_type === 'vip' ? 'default' : 'secondary'}>{selectedCustomer.customer_type?.toUpperCase() || 'NEW'}</Badge></div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Total Bookings:</strong> {selectedCustomer.total_bookings}</div>
                      <div><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.total_spent)}</div>
                      <div><strong>Avg per Booking:</strong> {selectedCustomer.total_bookings ? formatCurrency(selectedCustomer.total_spent / selectedCustomer.total_bookings) : "£0.00"}</div>
                      <div><strong>Last Booking:</strong> {selectedCustomer.last_booking_date ? format(new Date(selectedCustomer.last_booking_date), "dd MMM yyyy") : "Never"}</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedCustomer.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedCustomer.notes}</p>
                    </CardContent>
                  </Card>
                )}
                {/* Session Tokens Section */}
                <CustomerTokensSection 
                  customerEmail={selectedCustomer.email} 
                  customerName={selectedCustomer.full_name || selectedCustomer.email} 
                />

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
                                  {format(new Date(booking.session_date), 'dd MMM yyyy')} at {booking.session_time}
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
