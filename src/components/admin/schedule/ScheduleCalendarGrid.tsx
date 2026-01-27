import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  id: string;
  session_date: string;
  session_time: string;
  customer_name: string;
  customer_email: string;
  booking_type: string;
  guest_count: number;
  payment_status: string;
  booking_status: string;
  price_amount: number;
  final_amount?: number;
  service_type: string;
}

interface ScheduleCalendarGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  bookings: BookingData[];
}

export const ScheduleCalendarGrid = ({
  selectedDate,
  onDateSelect,
  onMonthChange,
  bookings
}: ScheduleCalendarGridProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(b => b.session_date === dateStr && b.booking_status !== 'cancelled');
  };

  const getRevenueForDate = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    return dayBookings.reduce((sum, b) => sum + (b.final_amount || b.price_amount), 0) / 100;
  };

  const getCapacityWarning = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    const totalGuests = dayBookings.reduce((sum, b) => sum + b.guest_count, 0);
    // 8 sessions per day (weekday) * 5 capacity = 40 max
    const maxCapacity = 40;
    const usagePercent = (totalGuests / maxCapacity) * 100;
    if (usagePercent >= 90) return 'critical';
    if (usagePercent >= 70) return 'warning';
    return null;
  };

  const handlePrevMonth = () => onMonthChange(subMonths(selectedDate, 1));
  const handleNextMonth = () => onMonthChange(addMonths(selectedDate, 1));

  return (
    <Card className="shadow-lg border-0 bg-card overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-2 sm:p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const dayBookings = getBookingsForDate(date);
            const revenue = getRevenueForDate(date);
            const totalGuests = dayBookings.reduce((sum, b) => sum + b.guest_count, 0);
            const capacityWarning = getCapacityWarning(date);
            const isCurrentMonth = isSameMonth(date, selectedDate);
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const hasUnpaid = dayBookings.some(b => b.payment_status === 'pending');

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={cn(
                  "relative min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg transition-all duration-200 text-left group",
                  "hover:bg-accent hover:shadow-md",
                  !isCurrentMonth && "opacity-40",
                  isSelected && "ring-2 ring-primary bg-primary/10",
                  isTodayDate && !isSelected && "bg-accent/50",
                  capacityWarning === 'critical' && "bg-destructive/10 hover:bg-destructive/20",
                  capacityWarning === 'warning' && "bg-yellow-500/10 hover:bg-yellow-500/20"
                )}
              >
                {/* Date Number */}
                <div className={cn(
                  "text-sm font-semibold mb-1",
                  isTodayDate && "text-primary",
                  isSelected && "text-primary"
                )}>
                  {format(date, 'd')}
                  {isTodayDate && (
                    <span className="ml-1 text-[10px] font-normal text-primary">Today</span>
                  )}
                </div>

                {/* Booking Info */}
                {dayBookings.length > 0 && (
                  <div className="space-y-1">
                    {/* Booking Count & Guests */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "px-1 py-0 text-[10px]",
                          hasUnpaid && "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                      </Badge>
                    </div>

                    {/* Guest Count */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{totalGuests} guests</span>
                    </div>

                    {/* Revenue */}
                    {revenue > 0 && (
                      <div className="text-[10px] sm:text-xs font-medium text-green-600">
                        £{revenue.toFixed(0)}
                      </div>
                    )}

                    {/* Capacity Warning */}
                    {capacityWarning && (
                      <div className={cn(
                        "absolute top-1 right-1",
                        capacityWarning === 'critical' ? "text-destructive" : "text-yellow-600"
                      )}>
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                    )}

                    {/* Preview of first bookings (desktop only) */}
                    <div className="hidden sm:block space-y-0.5 mt-1">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div 
                          key={booking.id}
                          className={cn(
                            "text-[9px] truncate px-1 py-0.5 rounded",
                            booking.booking_type === 'private' 
                              ? "bg-purple-100 text-purple-700" 
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {booking.session_time.slice(0, 5)} {booking.customer_name.split(' ')[0]}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-[9px] text-muted-foreground px-1">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
            <span>Private</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>Communal</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <span>High demand</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>Nearly full</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
