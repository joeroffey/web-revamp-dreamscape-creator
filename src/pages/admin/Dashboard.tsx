
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
  DollarSign,
  Settings
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { formatGBP, formatDateTime } from '@/lib/format';

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  activeGiftCards: number;
  activeMemberships: number;
  totalRevenue: number;
  recentBookings: any[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalBookings: 0,
    activeGiftCards: 0,
    activeMemberships: 0,
    totalRevenue: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total customers
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total bookings
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });

        // Fetch active gift cards
        const { count: giftCardsCount } = await supabase
          .from('gift_cards')
          .select('*', { count: 'exact', head: true })
          .eq('is_redeemed', false);

        // Fetch active memberships
        const { count: membershipsCount } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch total revenue from paid bookings
        const { data: paidBookings } = await supabase
          .from('bookings')
          .select('price_amount')
          .eq('payment_status', 'paid');

        const totalRevenue = paidBookings?.reduce((sum, booking) => sum + booking.price_amount, 0) || 0;

        // Fetch recent bookings
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalCustomers: customersCount || 0,
          totalBookings: bookingsCount || 0,
          activeGiftCards: giftCardsCount || 0,
          activeMemberships: membershipsCount || 0,
          totalRevenue: totalRevenue,
          recentBookings: recentBookings || []
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
      icon: DollarSign,
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

        {/* Quick Access Navigation */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <Button onClick={() => navigate('/admin/schedule')} variant="outline" size="sm" className="justify-start min-h-[44px]">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button onClick={() => navigate('/admin/customers')} variant="outline" size="sm" className="justify-start min-h-[44px]">
                <Users className="h-4 w-4 mr-2" />
                Manage Customers
              </Button>
              <Button onClick={() => navigate('/admin/bookings')} variant="outline" size="sm" className="justify-start min-h-[44px]">
                <Calendar className="h-4 w-4 mr-2" />
                View Bookings
              </Button>
              <Button onClick={() => navigate('/admin/gift-cards')} variant="outline" size="sm" className="justify-start min-h-[44px]">
                <Gift className="h-4 w-4 mr-2" />
                Gift Cards
              </Button>
              <Button onClick={() => navigate('/admin/memberships')} variant="outline" size="sm" className="justify-start min-h-[44px]">  
                <CreditCard className="h-4 w-4 mr-2" />
                Memberships
              </Button>
              <Button onClick={() => navigate('/admin/settings')} variant="outline" size="sm" className="justify-start min-h-[44px]">
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
                    <p className="text-xs text-muted-foreground mt-1">Tap to manage</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentBookings.length === 0 ? (
              <p className="text-muted-foreground">No recent bookings found.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground break-all">{booking.customer_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-medium">{formatCurrency(booking.price_amount)}</p>
                      <p className={`text-sm ${
                        booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {booking.payment_status}
                      </p>
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
