
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CreditCard, User, Calendar, Pause, Play, X } from 'lucide-react';

interface Membership {
  id: string;
  user_id: string;
  membership_type: string;
  sessions_per_week: number;
  sessions_remaining: number;
  discount_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
  stripe_subscription_id: string | null;
  user_email?: string;
  user_name?: string;
}

export default function AdminMemberships() {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data: membershipData, error } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user details for each membership
      const membershipsWithUsers = await Promise.all(
        (membershipData || []).map(async (membership) => {
          // Try to get user info from bookings first
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('customer_name, customer_email')
            .eq('user_id', membership.user_id)
            .limit(1);

          if (bookingData && bookingData.length > 0) {
            return {
              ...membership,
              user_email: bookingData[0].customer_email,
              user_name: bookingData[0].customer_name
            };
          }

          // Fallback to profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', membership.user_id)
            .single();

          return {
            ...membership,
            user_name: profileData?.full_name || 'Unknown User',
            user_email: 'No email available'
          };
        })
      );

      setMemberships(membershipsWithUsers);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMembershipStatus = async (membershipId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', membershipId);

      if (error) throw error;

      setMemberships(prev => 
        prev.map(membership => 
          membership.id === membershipId 
            ? { ...membership, status: newStatus }
            : membership
        )
      );

      toast({
        title: "Status Updated",
        description: `Membership status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating membership status:', error);
      toast({
        title: "Error",
        description: "Failed to update membership status",
        variant: "destructive",
      });
    }
  };

  const filteredMemberships = memberships.filter(membership => {
    const matchesSearch = 
      membership.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.membership_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || membership.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatMembershipType = (membershipType: string) => {
    switch (membershipType) {
      case '1_session_week': return '1 Session Per Week';
      case '2_sessions_week': return '2 Sessions Per Week';
      case 'unlimited': return 'Unlimited';
      default: return membershipType;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    cancelled: memberships.filter(m => m.status === 'cancelled').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Membership Management</h1>
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
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Membership Management</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memberships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Membership Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paused</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.paused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Memberships List */}
        <Card>
          <CardHeader>
            <CardTitle>Memberships ({filteredMemberships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMemberships.length === 0 ? (
              <p className="text-muted-foreground">No memberships found.</p>
            ) : (
              <div className="space-y-4">
                {filteredMemberships.map((membership) => (
                  <div 
                    key={membership.id} 
                    className="flex flex-col p-4 border rounded-lg hover:bg-accent transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatMembershipType(membership.membership_type)}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(membership.status)}>
                          {membership.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {membership.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'paused')}
                            className="min-h-[40px]"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        )}
                        {membership.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'active')}
                            className="min-h-[40px]"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        )}
                        {membership.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'cancelled')}
                            className="min-h-[40px]"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium break-all">{membership.user_name}</div>
                          <div className="text-muted-foreground break-all">{membership.user_email}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Sessions/Week</div>
                        <div className="font-medium">
                          {membership.sessions_per_week === 999 ? 'Unlimited' : membership.sessions_per_week}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Discount</div>
                        <div className="font-medium">{membership.discount_percentage}%</div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">{new Date(membership.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {membership.stripe_subscription_id && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        Stripe ID: {membership.stripe_subscription_id}
                      </div>
                    )}
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
