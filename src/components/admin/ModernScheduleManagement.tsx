import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { DailyScheduleView } from "@/components/admin/DailyScheduleView";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { CalendarDays, List, Plus, Clock, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface BookingData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_type: string;
  session_date: string;
  session_time: string;
  booking_status: string;
  payment_status: string;
  price_amount: number;
  guest_count: number;
  special_requests: string | null;
}

export default function ModernScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'daily'>('calendar');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (viewMode === 'calendar') {
        setViewMode('daily');
      }
    }
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  const todayBookings = bookings.filter(b => 
    b.session_date === format(new Date(), "yyyy-MM-dd")
  );

  const selectedDateBookings = bookings.filter(b => 
    b.session_date === format(selectedDate, "yyyy-MM-dd")
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Schedule Management
              </h1>
              <p className="text-gray-600 text-sm">Manage daily schedules and bookings</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="transition-all duration-200"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('daily')}
              className="transition-all duration-200"
            >
              <List className="h-4 w-4 mr-2" />
              Daily View
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayBookings.length}</div>
              <p className="text-xs text-blue-100 mt-1">Scheduled for today</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Selected Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{selectedDateBookings.length}</div>
              <p className="text-xs text-green-100 mt-1">{format(selectedDate, "MMM d")}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Total Guests Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {todayBookings.reduce((sum, booking) => sum + booking.guest_count, 0)}
              </div>
              <p className="text-xs text-purple-100 mt-1">Expected guests</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Has bookings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Monthly Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">
                        {format(selectedDate, "MMMM yyyy")}
                      </h3>
                    </div>
                    
                    <div className="text-center py-8 text-muted-foreground">
                      Calendar view - Click a date to see daily schedule
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Bookings</h4>
                      {loading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse p-3 border rounded-lg">
                              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          ))}
                        </div>
                      ) : bookings.slice(0, 3).length > 0 ? (
                        bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{booking.customer_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {booking.service_type} • {booking.session_time}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {booking.booking_status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No recent bookings</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DailyScheduleView
                selectedDate={selectedDate}
                bookings={selectedDateBookings as any}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </div>

        <CreateBookingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onBookingCreated={() => {
            setShowCreateDialog(false);
            handleRefresh();
          }}
          preselectedDate={selectedDate}
        />
      </div>
    </AdminLayout>
  );
}
