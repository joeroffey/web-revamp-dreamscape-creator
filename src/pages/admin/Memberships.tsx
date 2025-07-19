import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, CreditCard, User, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Membership {
  id: string;
  user_id: string;
  membership_type: string;
  sessions_per_week: number;
  sessions_remaining: number | null;
  last_session_reset: string | null;
  discount_percentage: number | null;
  status: string;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    full_name: string | null;
  } | null;
  user_email?: string;
}

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled' | 'expiring'>('all');

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from bookings (since we can't query auth.users directly)
      const membershipsWithEmails = await Promise.all(
        (data || []).map(async (membership) => {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('customer_email')
            .eq('user_id', membership.user_id)
            .limit(1);

          return {
            ...membership,
            user_email: bookings?.[0]?.customer_email || ''
          } as unknown as Membership;
        })
      );

      setMemberships(membershipsWithEmails);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiringMemberships = () => {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    return memberships.filter(membership => {
      if (membership.status !== 'active') return false;
      
      const lastReset = new Date(membership.last_session_reset);
      const nextReset = new Date(lastReset);
      nextReset.setDate(nextReset.getDate() + 7); // Assuming weekly reset
      
      return nextReset <= oneWeekFromNow && membership.sessions_remaining <= 1;
    });
  };

  const filteredMemberships = memberships.filter(membership => {
    const matchesSearch = 
      membership.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.membership_type.toLowerCase().includes(searchTerm.toLowerCase());

    switch (filter) {
      case 'active':
        return matchesSearch && membership.status === 'active';
      case 'paused':
        return matchesSearch && membership.status === 'paused';
      case 'cancelled':
        return matchesSearch && membership.status === 'cancelled';
      case 'expiring':
        return matchesSearch && getExpiringMemberships().some(exp => exp.id === membership.id);
      default:
        return matchesSearch;
    }
  });

  const getMembershipStatus = (membership: Membership) => {
    if (membership.status === 'cancelled') {
      return { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle };
    }
    if (membership.status === 'paused') {
      return { label: 'Paused', variant: 'secondary' as const, icon: AlertTriangle };
    }
    
    // Check if expiring (low sessions remaining)
    const isExpiring = getExpiringMemberships().some(exp => exp.id === membership.id);
    if (isExpiring) {
      return { label: 'Expiring Soon', variant: 'outline' as const, icon: AlertTriangle };
    }
    
    return { label: 'Active', variant: 'default' as const, icon: CheckCircle };
  };

  const updateMembershipStatus = async (membershipId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ status: newStatus })
        .eq('id', membershipId);

      if (error) throw error;

      setMemberships(prev =>
        prev.map(membership =>
          membership.id === membershipId
            ? { ...membership, status: newStatus }
            : membership
        )
      );
    } catch (error) {
      console.error('Error updating membership status:', error);
    }
  };

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    cancelled: memberships.filter(m => m.status === 'cancelled').length,
    expiring: getExpiringMemberships().length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Membership Management</h1>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Membership Management</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memberships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'expiring', label: 'Expiring Soon' },
            { key: 'paused', label: 'Paused' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? 'default' : 'outline'}
              onClick={() => setFilter(filterOption.key as any)}
              size="sm"
            >
              {filterOption.label}
              {filterOption.key === 'expiring' && stats.expiring > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.expiring}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Membership Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.paused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancelled
              </CardTitle>
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
                {filteredMemberships.map((membership) => {
                  const status = getMembershipStatus(membership);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div 
                      key={membership.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{membership.membership_type}</span>
                          </div>
                          <Badge variant={status.variant} className="flex items-center space-x-1">
                            <StatusIcon className="h-3 w-3" />
                            <span>{status.label}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {membership.discount_percentage}% discount
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{membership.profiles?.full_name || 'No name'}</span>
                            {membership.user_email && <span>({membership.user_email})</span>}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined: {new Date(membership.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span>
                            <strong>Sessions:</strong> {membership.sessions_remaining} / {membership.sessions_per_week} per week
                          </span>
                          <span>
                            <strong>Last Reset:</strong> {new Date(membership.last_session_reset).toLocaleDateString()}
                          </span>
                        </div>

                        {membership.stripe_subscription_id && (
                          <div className="text-xs text-muted-foreground">
                            Stripe ID: {membership.stripe_subscription_id}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {membership.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'paused')}
                          >
                            Pause
                          </Button>
                        )}
                        {membership.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'active')}
                          >
                            Resume
                          </Button>
                        )}
                        {membership.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateMembershipStatus(membership.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}