import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { EnhancedCreateBookingDialog } from "@/components/admin/EnhancedCreateBookingDialog";
import { ScheduleCalendarGrid } from "@/components/admin/schedule/ScheduleCalendarGrid";
import { ScheduleTimelineView } from "@/components/admin/schedule/ScheduleTimelineView";
import { ScheduleStatsCards } from "@/components/admin/schedule/ScheduleStatsCards";
import { CalendarDays, LayoutGrid, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  service_type: string;
  time_slot_id?: string;
  final_amount?: number;
}

export default function ModernScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings for the entire month for calendar view
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("session_date", format(monthStart, "yyyy-MM-dd"))
        .lte("session_date", format(monthEnd, "yyyy-MM-dd"))
        .in("payment_status", ["paid", "pending"])
        .order("session_date", { ascending: true })
        .order("session_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('timeline');
  };

  const handleMonthChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  const selectedDateBookings = bookings.filter(b => 
    b.session_date === format(selectedDate, "yyyy-MM-dd")
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader title="Schedule" description="View and manage your upcoming sessions." />
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-[500px] bg-muted rounded-lg" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Schedule"
          description={viewMode === 'calendar' 
            ? "Click any day to see detailed timeline" 
            : `Viewing ${format(selectedDate, "EEEE, MMMM d")}`
          }
          right={
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'timeline')}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="calendar" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Timeline</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Booking</span>
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <ScheduleStatsCards bookings={bookings} selectedDate={selectedDate} />

        {/* Main View */}
        {viewMode === 'calendar' ? (
          <ScheduleCalendarGrid
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            bookings={bookings}
          />
        ) : (
          <ScheduleTimelineView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            bookings={selectedDateBookings}
            onRefresh={handleRefresh}
          />
        )}

        <EnhancedCreateBookingDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) handleRefresh();
          }}
          selectedDate={selectedDate}
        />
      </div>
    </AdminLayout>
  );
}
