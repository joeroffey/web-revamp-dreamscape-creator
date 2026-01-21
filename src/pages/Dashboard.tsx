
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, CreditCard, Settings, RefreshCw, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  session_date: string;
  session_time: string;
  service_type: string;
  booking_status: string;
  payment_status: string;
  price_amount: number;
}

interface Membership {
  id: string;
  membership_type: string;
  status: string;
  sessions_per_week: number;
  sessions_remaining: number;
  discount_percentage: number;
  is_auto_renew?: boolean;
  end_date?: string;
  stripe_subscription_id?: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  console.log('Dashboard - user:', user?.email, 'isAdmin:', isAdmin, 'adminLoading:', adminLoading);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    console.log('Dashboard redirect useEffect - adminLoading:', adminLoading, 'isAdmin:', isAdmin);
    if (!adminLoading && isAdmin) {
      console.log('Redirecting admin user to admin dashboard');
      navigate('/admin/dashboard');
      return;
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    console.log('Dashboard data fetch useEffect - adminLoading:', adminLoading, 'isAdmin:', isAdmin, 'user:', !!user);
    
    // Handle loading state immediately based on admin check
    if (!adminLoading) {
      if (isAdmin) {
        console.log('Admin user detected, stopping loading (will redirect)');
        setLoading(false);
        return;
      } else if (user) {
        console.log('Regular user detected, fetching data');
        fetchUserData();
      } else {
        console.log('No user detected, stopping loading');
        setLoading(false);
      }
    }
  }, [user, isAdmin, adminLoading]);

  const fetchUserData = async () => {
    console.log('fetchUserData called for user:', user?.id);
    try {
      setLoading(true);
      
      // Fetch user profile for first name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      if (profileData?.full_name) {
        // Extract first name from full name
        const firstNameOnly = profileData.full_name.split(' ')[0];
        setFirstName(firstNameOnly);
      }

      // Fetch user bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user?.id)
        .order("session_date", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch user membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }
      setMembership(membershipData);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleCancelSubscription = async () => {
    if (!membership?.id || !user?.id) return;
    
    setCancellingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-membership', {
        body: {
          membershipId: membership.id,
          userId: user.id,
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Your membership will not auto-renew. You can continue using it until the end of your billing period.",
      });

      // Refresh membership data
      setMembership(prev => prev ? { ...prev, is_auto_renew: false } : null);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const formatServiceType = (serviceType: string) => {
    switch (serviceType) {
      case 'ice_bath': return 'Ice Bath';
      case 'sauna': return 'Sauna';
      case 'combined': return 'Combined Session';
      default: return serviceType;
    }
  };

  const formatMembershipType = (membershipType: string) => {
    switch (membershipType) {
      case '1_session_week': return '1 Session Per Week';
      case '2_sessions_week': return '2 Sessions Per Week';
      case 'unlimited': return 'Unlimited';
      default: return membershipType;
    }
  };

  // Show loading only while checking admin status or loading user data for regular users
  if (adminLoading || (loading && !isAdmin)) {
    return (
      <div className="min-h-screen bg-gallery">
        <Navigation />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-6 py-24">
            <div className="text-center">
              {adminLoading ? "Checking access..." : "Loading your dashboard..."}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if user is admin (they'll be redirected)
  if (isAdmin) {
    return null;
  }

  // If no user and not loading, show sign in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gallery">
        <Navigation />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-6 py-24">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Please sign in to view your dashboard.</p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gallery">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-light text-foreground mb-2">
                  Welcome back{firstName ? `, ${firstName}` : ''}!
                </h1>
                <p className="text-muted-foreground">
                  Manage your bookings and membership
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Sign Out
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* User Info */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Membership Info */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Membership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {membership ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {formatMembershipType(membership.membership_type)}
                        </span>
                        <Badge variant="secondary">
                          {membership.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{membership.sessions_per_week === 999 ? 'Unlimited' : `${membership.sessions_per_week} sessions/week`}</p>
                        <p>{membership.discount_percentage}% discount on products</p>
                        {membership.end_date && (
                          <p>Expires: {new Date(membership.end_date).toLocaleDateString()}</p>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          <RefreshCw className="h-3 w-3" />
                          <span>{membership.is_auto_renew ? 'Auto-renewing' : 'One-time purchase'}</span>
                        </div>
                      </div>
                      {membership.is_auto_renew && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2 text-destructive hover:text-destructive"
                          onClick={handleCancelSubscription}
                          disabled={cancellingSubscription}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {cancellingSubscription ? 'Cancelling...' : 'Cancel Auto-Renewal'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-3">No active membership</p>
                      <Button size="sm">
                        <a href="/memberships">View Plans</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="sm">
                    <a href="/booking" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Book Session
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <a href="/gift-cards" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Gift Cards
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card className="wellness-card mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">
                              {formatServiceType(booking.service_type)}
                            </span>
                            <Badge 
                              variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                            >
                              {booking.payment_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.session_date).toLocaleDateString()} at {booking.session_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£{(booking.price_amount / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No bookings yet</p>
                    <Button className="mt-4" size="sm">
                      <a href="/booking">Book Your First Session</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
