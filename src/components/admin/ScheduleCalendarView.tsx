
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface ScheduleCalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  monthlyStats: Record<string, number>;
  bookings: BookingData[];
}

export const ScheduleCalendarView = ({
  selectedDate,
  onDateSelect,
  monthlyStats,
  bookings
}: ScheduleCalendarViewProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getRevenueFororDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(booking => booking.session_date === dateStr)
      .reduce((sum, booking) => sum + booking.price_amount, 0) / 100;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.session_date === dateStr);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const bookingCount = monthlyStats[dateStr] || 0;
            const revenue = getRevenueFororDate(date);
            const dayBookings = getBookingsForDate(date);
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, selectedDate);

            return (
              <div
                key={dateStr}
                onClick={() => onDateSelect(date)}
                className={`
                  p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                  ${bookingCount > 0 ? 'border-primary/50' : 'border-border'}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {format(date, 'd')}
                </div>
                
                {bookingCount > 0 && (
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
                    </Badge>
                    
                    {revenue > 0 && (
                      <div className="text-xs text-muted-foreground">
                        £{revenue.toFixed(0)}
                      </div>
                    )}
                    
                    <div className="text-xs space-y-0.5">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div key={booking.id} className="truncate">
                          {booking.session_time.slice(0, 5)} - {booking.customer_name.split(' ')[0]}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-muted-foreground">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
