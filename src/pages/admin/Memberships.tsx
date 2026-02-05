import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CreditCard, User, Calendar, Pause, Play, X, Mail, Clock, AlertTriangle, RefreshCw, ShoppingBag, Plus } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { CreateMembershipDialog } from '@/components/admin/CreateMembershipDialog';

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
  customer_email: string | null;
  customer_name: string | null;
  start_date: string | null;
  end_date: string | null;
  is_auto_renew: boolean | null;
}

export default function AdminMemberships() {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled' | 'expired'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

      setMemberships(membershipData || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast({
        title: "Error",
        description: "Failed to load memberships",
        variant: "destructive",
      });
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
      membership.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.membership_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || membership.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatMembershipType = (membershipType: string) => {
    switch (membershipType) {
      case '1_session_week': return '4 Sessions/Month (Legacy)';
      case '2_sessions_week': return '8 Sessions/Month (Legacy)';
      case '4_sessions_month': return '4 Sessions Per Month';
      case '8_sessions_month': return '8 Sessions Per Month';
      case 'unlimited': return 'Unlimited';
      default: return membershipType;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'outline';
      default: return 'outline';
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(parseISO(endDate), new Date());
    return days;
  };

  const isExpiringSoon = (endDate: string | null) => {
    const days = getDaysRemaining(endDate);
    return days !== null && days <= 7 && days >= 0;
  };

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    cancelled: memberships.filter(m => m.status === 'cancelled').length,
    expired: memberships.filter(m => m.status === 'expired').length
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
      <CreateMembershipDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onMembershipCreated={fetchMemberships}
      />
      
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Membership Management</h1>
            <Button onClick={() => setShowCreateDialog(true)} className="hidden sm:flex">
              <Plus className="mr-2 h-4 w-4" />
              Add Membership
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
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
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)} className="sm:hidden w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Membership
            </Button>
          </div>
        </div>

        {/* Membership Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
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
              <div className="text-2xl font-bold text-primary">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paused</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">{stats.paused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.cancelled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.expired}</div>
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
                  const daysRemaining = getDaysRemaining(membership.end_date);
                  const expiringSoon = isExpiringSoon(membership.end_date);
                  
                  return (
                      <div 
                      key={membership.id} 
                      className={`flex flex-col p-4 border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors space-y-4 ${
                        expiringSoon && membership.status === 'active' ? 'border-primary/50 bg-primary/5' : ''
                      }`}
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
                          <Badge variant="outline" className={membership.is_auto_renew ? "text-green-600 border-green-500/50 bg-green-50" : "text-muted-foreground"}>
                            {membership.is_auto_renew ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Subscription
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="h-3 w-3 mr-1" />
                                One-time
                              </>
                            )}
                          </Badge>
                          {expiringSoon && membership.status === 'active' && (
                            <Badge variant="outline" className="text-primary border-primary/50">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expires in {daysRemaining} days
                            </Badge>
                          )}
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
                          {membership.status !== 'cancelled' && membership.status !== 'expired' && (
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
                        {/* Customer Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Customer</span>
                          </div>
                          <div className="font-medium break-all">
                            {membership.customer_name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground break-all">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {membership.customer_email || 'No email'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Sessions Info */}
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Monthly Sessions</div>
                          <div className="font-medium">
                            {membership.sessions_per_week === 999 || membership.membership_type === 'unlimited' 
                              ? 'Unlimited' 
                              : (() => {
                                  // Legacy memberships stored 1 or 2 for weekly, need to show as 4 or 8 monthly
                                  const isLegacy = membership.membership_type === '1_session_week' || membership.membership_type === '2_sessions_week';
                                  const monthlyTotal = isLegacy ? membership.sessions_per_week * 4 : membership.sessions_per_week;
                                  return `${membership.sessions_remaining} / ${monthlyTotal} remaining this month`;
                                })()}
                          </div>
                        </div>
                        
                        {/* Start Date */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Start Date</span>
                          </div>
                          <div className="font-medium">
                            {membership.start_date 
                              ? format(parseISO(membership.start_date), 'dd MMM yyyy')
                              : format(parseISO(membership.created_at), 'dd MMM yyyy')}
                          </div>
                        </div>
                        
                        {/* End Date */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>End Date</span>
                          </div>
                          <div className={`font-medium ${expiringSoon && membership.status === 'active' ? 'text-primary' : ''}`}>
                            {membership.end_date 
                              ? format(parseISO(membership.end_date), 'dd MMM yyyy')
                              : 'Not set'}
                          </div>
                        </div>
                      </div>

                      {membership.stripe_subscription_id && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          Stripe ID: {membership.stripe_subscription_id}
                        </div>
                      )}
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
