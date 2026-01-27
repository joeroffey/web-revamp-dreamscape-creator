import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Edit,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BookingDetailsDialog } from '../BookingDetailsDialog';
import { EditBookingDialog } from '../EditBookingDialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, subDays } from 'date-fns';

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

interface ScheduleTimelineViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  bookings: BookingData[];
  onRefresh: () => void;
}

// Based on the business hours - actual time slots for the day
const WEEKDAY_TIMES = ['08:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];
const SUNDAY_TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00'];

export const ScheduleTimelineView = ({ 
  selectedDate, 
  onDateChange,
  bookings, 
  onRefresh 
}: ScheduleTimelineViewProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const { toast } = useToast();

  const dayOfWeek = selectedDate.getDay();
  const isClosed = dayOfWeek === 1; // Monday
  const isSunday = dayOfWeek === 0;
  const timeSlots = isSunday ? SUNDAY_TIMES : WEEKDAY_TIMES;

  const getBookingsForSlot = (timeSlot: string) => {
    return bookings.filter(b => 
      b.session_time.startsWith(timeSlot) && 
      b.booking_status !== 'cancelled'
    );
  };

  const handleCheckIn = async (booking: BookingData) => {
    setCheckingIn(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'completed' })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Checked in!",
        description: `${booking.customer_name} has been checked in.`,
      });
      onRefresh();
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "Failed to check in guest",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleEditBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setEditOpen(true);
  };

  const totalRevenue = bookings
    .filter(b => b.booking_status !== 'cancelled')
    .reduce((sum, b) => sum + (b.final_amount || b.price_amount), 0) / 100;
  
  const totalGuests = bookings
    .filter(b => b.booking_status !== 'cancelled')
    .reduce((sum, b) => sum + b.guest_count, 0);

  const completedCount = bookings.filter(b => b.booking_status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Day Header with Navigation */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(subDays(selectedDate, 1))}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold">{format(selectedDate, 'EEEE')}</h2>
              <p className="text-sm opacity-90">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(addDays(selectedDate, 1))}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 divide-x bg-muted/30">
          <div className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{bookings.filter(b => b.booking_status !== 'cancelled').length}</div>
            <div className="text-xs text-muted-foreground">Bookings</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{totalGuests}</div>
            <div className="text-xs text-muted-foreground">Total Guests</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">£{totalRevenue.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Revenue</div>
          </div>
        </div>

        {/* Progress Bar */}
        {bookings.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Check-ins</span>
              <span className="font-medium">{completedCount}/{bookings.filter(b => b.booking_status !== 'cancelled').length}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedCount / Math.max(bookings.filter(b => b.booking_status !== 'cancelled').length, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      {isClosed ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Closed on Mondays</h3>
              <p className="text-sm">The facility is closed. Select another day to view bookings.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {timeSlots.map((timeSlot, index) => {
                const slotBookings = getBookingsForSlot(timeSlot);
                const totalSlotGuests = slotBookings.reduce((sum, b) => sum + b.guest_count, 0);
                const hasPrivate = slotBookings.some(b => b.booking_type === 'private');
                const remainingCapacity = hasPrivate ? 0 : 5 - totalSlotGuests;
                const isNearlyFull = remainingCapacity <= 1 && remainingCapacity > 0;
                const isFull = remainingCapacity <= 0;

                return (
                  <div key={timeSlot} className="flex">
                    {/* Time Column */}
                    <div className={cn(
                      "w-20 sm:w-24 flex-shrink-0 p-3 sm:p-4 border-r flex flex-col items-center justify-start",
                      isFull && "bg-destructive/5",
                      isNearlyFull && "bg-yellow-500/5"
                    )}>
                      <div className="text-lg font-bold">{timeSlot}</div>
                      <div className={cn(
                        "text-xs mt-1 flex items-center gap-1",
                        isFull ? "text-destructive" : isNearlyFull ? "text-yellow-600" : "text-muted-foreground"
                      )}>
                        <Users className="h-3 w-3" />
                        {totalSlotGuests}/5
                      </div>
                      {(isFull || isNearlyFull) && (
                        <AlertTriangle className={cn(
                          "h-4 w-4 mt-1",
                          isFull ? "text-destructive" : "text-yellow-600"
                        )} />
                      )}
                    </div>

                    {/* Bookings Column */}
                    <div className="flex-1 p-3 sm:p-4 min-h-[100px]">
                      {slotBookings.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          No bookings
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slotBookings.map(booking => (
                            <div
                              key={booking.id}
                              className={cn(
                                "relative rounded-lg p-3 transition-all",
                                booking.booking_type === 'private' 
                                  ? "bg-purple-50 border-l-4 border-purple-500" 
                                  : "bg-blue-50 border-l-4 border-blue-500",
                                booking.booking_status === 'completed' && "opacity-60"
                              )}
                            >
                              {/* Booking Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm sm:text-base truncate">
                                      {booking.customer_name}
                                    </h4>
                                    {booking.booking_status === 'completed' && (
                                      <Badge className="bg-green-100 text-green-800 text-[10px]">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Checked in
                                      </Badge>
                                    )}
                                    {booking.payment_status === 'pending' && (
                                      <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                                        UNPAID
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Contact Info */}
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{booking.customer_email}</span>
                                    </span>
                                    {booking.customer_phone && (
                                      <span className="hidden sm:flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {booking.customer_phone}
                                      </span>
                                    )}
                                  </div>

                                  {/* Badges */}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]">
                                      <Users className="h-3 w-3 mr-1" />
                                      {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
                                    </Badge>
                                    <Badge 
                                      className={cn(
                                        "text-[10px]",
                                        booking.booking_type === 'private' 
                                          ? "bg-purple-100 text-purple-800" 
                                          : "bg-blue-100 text-blue-800"
                                      )}
                                    >
                                      {booking.booking_type}
                                    </Badge>
                                    <span className="text-xs font-medium text-green-600">
                                      £{((booking.final_amount || booking.price_amount) / 100).toFixed(0)}
                                    </span>
                                  </div>

                                  {booking.special_requests && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                      📝 {booking.special_requests}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                  {booking.booking_status !== 'completed' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCheckIn(booking)}
                                          disabled={checkingIn === booking.id}
                                          className="h-8 w-8 p-0 hover:bg-green-100"
                                        >
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Check in</TooltipContent>
                                    </Tooltip>
                                  )}

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit / Reschedule
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedBooking && (
        <>
          <BookingDetailsDialog
            booking={selectedBooking}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <EditBookingDialog
            booking={selectedBooking}
            open={editOpen}
            onOpenChange={setEditOpen}
            onBookingUpdated={onRefresh}
          />
        </>
      )}
    </div>
  );
};
