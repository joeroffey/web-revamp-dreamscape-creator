import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
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
  stripe_session_id?: string;
  final_amount?: number;
}

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // Always fetch for the selected date only (daily view)
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('session_date', dateStr)
        .eq('payment_status', 'paid')
        .order('session_time', { ascending: true });

      if (error) throw error;

      setBookings(bookingsData || []);

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
              {`Daily schedule for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.reduce((sum, booking) => sum + booking.guest_count, 0)}
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
              />
            </CardContent>
          </Card>

          {/* Daily Schedule View */}
          <div className="lg:col-span-2">
            <DailyScheduleView
              selectedDate={selectedDate}
              bookings={bookings}
              onRefresh={fetchScheduleData}
            />
          </div>
        </div>

        <CreateBookingDialog
          open={createBookingOpen}
          onOpenChange={setCreateBookingOpen}
          onBookingCreated={handleBookingCreated}
          preselectedDate={selectedDate}
        />
      </div>
    </AdminLayout>
  );
}
