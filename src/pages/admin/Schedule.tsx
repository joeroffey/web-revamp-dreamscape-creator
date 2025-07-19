
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarIcon, Clock, Users, Plus, Eye } from 'lucide-react';
import { ScheduleCalendarView } from '@/components/admin/ScheduleCalendarView';
import { DailyScheduleView } from '@/components/admin/DailyScheduleView';
import { CreateBookingDialog } from '@/components/admin/CreateBookingDialog';

interface BookingData {
  id: string;
  session_date: string;
  session_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_type: string;
  guest_count: number;
  payment_status: string;
  booking_status: string;
  price_amount: number;
  special_requests?: string;
  time_slot_id: string;
  service_type: string;
}

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'daily'>('calendar');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<Record<string, number>>({});
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate, viewMode]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      
      if (viewMode === 'calendar') {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      } else {
        startDate = new Date(selectedDate);
        endDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('session_date', format(startDate, 'yyyy-MM-dd'))
        .lte('session_date', format(endDate, 'yyyy-MM-dd'))
        .eq('payment_status', 'paid')
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true });

      if (error) throw error;

      setBookings(bookingsData || []);

      // Calculate monthly stats for calendar view
      if (viewMode === 'calendar') {
        const stats: Record<string, number> = {};
        bookingsData?.forEach(booking => {
          const dateKey = booking.session_date;
          stats[dateKey] = (stats[dateKey] || 0) + 1;
        });
        setMonthlyStats(stats);
      }

    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
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

  const handleBookingCreated = () => {
    fetchScheduleData();
    setCreateBookingOpen(false);
    toast({
      title: "Success",
      description: "Booking created successfully",
    });
  };

  const getTodayBookings = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return bookings.filter(booking => booking.session_date === today);
  };

  const getSelectedDateBookings = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.session_date === selectedDateStr);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Schedule Management</h1>
            <p className="text-muted-foreground mt-2">
              {viewMode === 'calendar' 
                ? `Viewing ${format(selectedDate, 'MMMM yyyy')}` 
                : `Daily schedule for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              size="sm"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              size="sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              Daily
            </Button>
            <Button
              onClick={() => setCreateBookingOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTodayBookings().length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Selected Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getSelectedDateBookings().length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Guests Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTodayBookings().reduce((sum, booking) => sum + booking.guest_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                modifiers={{
                  hasBookings: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return monthlyStats[dateStr] > 0;
                  }
                }}
                modifiersStyles={{
                  hasBookings: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '50%'
                  }
                }}
              />
              
              {/* Legend */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Has bookings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Schedule View */}
          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <ScheduleCalendarView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                monthlyStats={monthlyStats}
                bookings={bookings}
              />
            ) : (
              <DailyScheduleView
                selectedDate={selectedDate}
                bookings={getSelectedDateBookings()}
                onRefresh={fetchScheduleData}
              />
            )}
          </div>
        </div>

        <CreateBookingDialog
          open={createBookingOpen}
          onOpenChange={setCreateBookingOpen}
          onBookingCreated={handleBookingCreated}
          preselectedDate={viewMode === 'daily' ? selectedDate : undefined}
        />
      </div>
    </AdminLayout>
  );
}
