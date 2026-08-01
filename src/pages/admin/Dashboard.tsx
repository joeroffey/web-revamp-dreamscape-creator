import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Gift,
  CreditCard,
  TrendingUp,
  PoundSterling,
  Settings,
  ChevronRight,
  ArrowRight,
  Clock,
  Coins,
  Menu,
  Plus,
  MenuIcon,
  BarChart3
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BookingDetailsDialog } from '@/components/admin/BookingDetailsDialog';
import { formatGBP, formatDateTime } from '@/lib/format';
import { CreateBookingDialog } from '@/components/admin/CreateBookingDialog';
import { AddTokensDialog } from '@/components/admin/AddTokensDialog';
import { useCustomerSearch, CustomerSearchResult } from '@/hooks/useCustomerSearch';


interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  activeGiftCards: number;
  activeMemberships: number;
  totalRevenue: number;
  recentBookings: any[];
  recentCustomers: any[];
  weeklyBookings: Array<{ name: string; bookings: number }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalBookings: 0,
    activeGiftCards: 0,
    activeMemberships: 0,
    totalRevenue: 0,
    recentBookings: [],
    recentCustomers: [],
    weeklyBookings: [
      { name: 'Mon', bookings: 0 },
      { name: 'Tue', bookings: 0 },
      { name: 'Wed', bookings: 0 },
      { name: 'Thu', bookings: 0 },
      { name: 'Fri', bookings: 0 },
      { name: 'Sat', bookings: 0 },
      { name: 'Sun', bookings: 0 }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showAddTokens, setShowAddTokens] = useState(false);
  const [selectedCustomerForTokens, setSelectedCustomerForTokens] = useState<CustomerSearchResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch unique customers from bookings + CRM customers table
        const [{ data: bookingEmails }, { data: crmCustomers }] = await Promise.all([
          supabase.from('bookings').select('customer_email, customer_name, customer_phone'),
          supabase.from('customers').select('email, full_name, phone')
        ]);

        const uniqueEmails = new Map<string, { name: string | null; phone: string | null }>();

        (bookingEmails || []).forEach((b: any) => {
          if (b.customer_email) {
            uniqueEmails.set(b.customer_email.toLowerCase(), {
              name: b.customer_name,
              phone: b.customer_phone
            });
          }
        });

        (crmCustomers || []).forEach((c: any) => {
          if (c.email) {
            uniqueEmails.set(c.email.toLowerCase(), {
              name: c.full_name,
              phone: c.phone
            });
          }
        });

        const totalCustomers = uniqueEmails.size;

        // Fetch total bookings (paid only for accurate count)
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'paid');

        // Fetch active gift cards (paid and not redeemed)
        const { count: giftCardsCount } = await supabase
          .from('gift_cards')
          .select('*', { count: 'exact', head: true })
          .eq('is_redeemed', false)
          .eq('payment_status', 'paid');

        // Fetch active memberships
        const { count: membershipsCount } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch total revenue from paid bookings, gift cards, and memberships
        const [{ data: paidBookings }, { data: paidGiftCards }, { data: paidMemberships }] = await Promise.all([
          supabase
            .from('bookings')
            .select('price_amount, final_amount, discount_amount')
            .eq('payment_status', 'paid'),
          supabase
            .from('gift_cards')
            .select('amount, final_amount, discount_amount')
            .eq('payment_status', 'paid'),
          supabase
            .from('memberships')
            .select('price_amount, discount_amount')
            .eq('status', 'active')
        ]);

        const bookingRevenue = paidBookings?.reduce((sum, booking: any) => {
          const original = Number(booking.price_amount || 0);
          const discount = Number(booking.discount_amount || 0);
          const final = Number(booking.final_amount ?? (original - discount));
          return sum + final;
        }, 0) || 0;

        const giftCardRevenue = paidGiftCards?.reduce((sum, gc: any) => {
          const original = Number(gc.amount || 0);
          const discount = Number(gc.discount_amount || 0);
          const final = Number(gc.final_amount ?? (original - discount));
          return sum + final;
        }, 0) || 0;

        const membershipRevenue = paidMemberships?.reduce((sum, m: any) => {
          const original = Number(m.price_amount || 0);
          const discount = Number(m.discount_amount || 0);
          return sum + Math.max(0, original - discount);
        }, 0) || 0;

        const totalRevenue = bookingRevenue + giftCardRevenue + membershipRevenue;

        // Fetch recent bookings (last 5)
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent customers (last 5 unique customers)
        const { data: recentBookingCustomers } = await supabase
          .from('bookings')
          .select('customer_email, customer_name, customer_phone, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        // Process recent customers to get unique ones
        const recentCustomerMap = new Map<string, { name: string | null; email: string; phone: string | null; date: string }>();
        (recentBookingCustomers || []).forEach((b: any) => {
          if (b.customer_email && !recentCustomerMap.has(b.customer_email.toLowerCase())) {
            recentCustomerMap.set(b.customer_email.toLowerCase(), {
              name: b.customer_name,
              email: b.customer_email,
              phone: b.customer_phone,
              date: b.created_at
            });
          }
        });

        const recentCustomers = Array.from(recentCustomerMap.values()).slice(0, 5);

        // Fetch weekly bookings (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: weeklyBookingsData } = await supabase
          .from('bookings')
          .select('session_date')
          .gte('session_date', oneWeekAgo.toISOString().split('T')[0])
          .eq('payment_status', 'paid');

        const weeklyBookingsMap = new Map<string, number>();
        (weeklyBookingsData || []).forEach((b: any) => {
          const date = new Date(b.session_date);
          const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' }).toLocaleUpperCase();
          const currentCount = weeklyBookingsMap.get(dayName) || 0;
          weeklyBookingsMap.set(dayName, currentCount + 1);
        });

        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyBookings = weekDays.map(day => ({
          name: day,
          bookings: weeklyBookingsMap.get(day) || 0
        }));

        setStats({
          totalCustomers,
          totalBookings: bookingsCount || 0,
          activeGiftCards: giftCardsCount || 0,
          activeMemberships: membershipsCount || 0,
          totalRevenue: totalRevenue,
          recentBookings: recentBookings || [],
          recentCustomers: recentCustomers || [],
          weeklyBookings
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = formatGBP;

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      action: () => navigate('/admin/customers')
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-600',
      action: () => navigate('/admin/bookings')
    },
    {
      title: 'Active Gift Cards',
      value: stats.activeGiftCards,
      icon: Gift,
      color: 'text-purple-600',
      action: () => navigate('/admin/gift-cards')
    },
    {
      title: 'Active Memberships',
      value: stats.activeMemberships,
      icon: CreditCard,
      color: 'text-orange-600',
      action: () => navigate('/admin/memberships')
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: PoundSterling,
      color: 'text-emerald-600'
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader title="Dashboard" description="Overview of bookings, customers, and revenue." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
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
          title="Dashboard"
          description="Overview of bookings, customers, and revenue."
          right={
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Last updated: {formatDateTime(new Date())}</span>
            </div>
          }
        />

        {/* Quick Actions */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <Button
                onClick={() => setShowCreateBooking(true)}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
              <Button
                onClick={() => navigate('/admin/customers')}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Customers
              </Button>
              <Button
                onClick={() => navigate('/admin/bookings')}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Bookings
              </Button>
              <Button
                onClick={() => navigate('/admin/gift-cards')}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <Gift className="h-4 w-4 mr-2" />
                Gift Cards
              </Button>
              <Button
                onClick={() => navigate('/admin/memberships')}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Memberships
              </Button>
              <Button
                onClick={() => navigate('/admin/settings')}
                variant="outline"
                size="sm"
                className="justify-start min-h-[44px]"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md min-h-[120px] ${stat.action ? 'hover:scale-105' : ''}`}
                onClick={stat.action}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                  {stat.action && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      View <ArrowRight className="h-3 w-3" />
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Token Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-row items-center space-x-2">
              <CardTitle>Quick Token Management</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/customers')}>
              Manage All Customers <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentCustomers.length === 0 ? (
              <p className="text-muted-foreground">No recent customers found.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentCustomers.map((customer) => (
                  <div
                    key={customer.email}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded lg:hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.name || 'No name'}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(customer.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerForTokens(customer);
                            setShowAddTokens(true);
                          }}
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          Add Tokens
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/customers?search=${encodeURIComponent(customer.email || '')}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings and Weekly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bookings')}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentBookings.length === 0 ? (
                <p className="text-muted-foreground">No recent bookings found.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 hover:bg-accent/50 hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{booking.customer_email}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left sm:text-right">
                          <p className="font-medium">{formatCurrency(booking.price_amount)}</p>
                          <p className={`text-sm ${
                            booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {booking.payment_status}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Booking Trends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Weekly Booking Trends</CardTitle>
              <BarChart3 className="h-4 w-4 ml-2" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3 h-48">
                {stats.weeklyBookings.map((d) => {
                  const max = Math.max(1, ...stats.weeklyBookings.map((x) => x.bookings));
                  const pct = Math.round((d.bookings / max) * 100);
                  return (
                    <div key={d.name} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                      <span className="text-xs text-muted-foreground">{d.bookings}</span>
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${Math.max(pct, d.bookings > 0 ? 6 : 2)}%` }}
                        title={`${d.bookings} bookings`}
                      />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>

          </Card>
        </div>

        {selectedBooking && (
          <BookingDetailsDialog
            booking={selectedBooking}
            open={!!selectedBooking}
            onOpenChange={(open) => !open && setSelectedBooking(null)}
          />
        )}

        {/* Create Booking Dialog */}
        <CreateBookingDialog
          open={showCreateBooking}
          onOpenChange={setShowCreateBooking}
          onBookingCreated={() => {
            setShowCreateBooking(false);
            // Refresh stats after creating a booking
          }}
        />

        {/* Add Tokens Dialog */}
        {selectedCustomerForTokens && (
          <AddTokensDialog
            open={showAddTokens}
            onOpenChange={(open) => {
              if (!open) setSelectedCustomerForTokens(null);
              setShowAddTokens(false);
            }}
            customerEmail={selectedCustomerForTokens.email}
            customerName={selectedCustomerForTokens.name || 'Unknown Customer'}
            onTokensAdded={() => {
              setShowAddTokens(false);
              setSelectedCustomerForTokens(null);
              // Refresh stats after adding tokens
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}