import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Calendar, 
  Gift, 
  CreditCard,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  activeGiftCards: number;
  activeMemberships: number;
  totalRevenue: number;
  recentBookings: any[];
}

export default function AdminDashboard() {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Active Gift Cards',
      value: stats.activeGiftCards,
      icon: Gift,
      color: 'text-purple-600'
    },
    {
      title: 'Active Memberships',
      value: stats.activeMemberships,
      icon: CreditCard,
      color: 'text-orange-600'
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
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
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                      </p>
                    </div>
                    <div className="text-right">
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