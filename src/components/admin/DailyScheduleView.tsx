
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
  Edit, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { EditBookingDialog } from './EditBookingDialog';

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
  stripe_session_id?: string;
  final_amount?: number;
}

interface DailyScheduleViewProps {
  selectedDate: Date;
  bookings: BookingData[];
  onRefresh: () => void;
}

export const DailyScheduleView = ({ selectedDate, bookings, onRefresh }: DailyScheduleViewProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Generate time slots from 9 AM to 7 PM
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, '0')}:00:00`;
  });

  const getBookingsForTimeSlot = (timeSlot: string) => {
    return bookings.filter(booking => booking.session_time === timeSlot);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingTypeColor = (type: string) => {
    return type === 'private' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleEditBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setEditOpen(true);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "HH:MM"
  };

  const formatServiceType = (serviceType: string) => {
    switch (serviceType) {
      case 'ice_bath': return 'Ice Bath';
      case 'sauna': return 'Sauna';
      case 'combined': return 'Combined Session';
      default: return serviceType;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Schedule - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSlots.map(timeSlot => {
              const slotBookings = getBookingsForTimeSlot(timeSlot);
              const totalGuests = slotBookings.reduce((sum, booking) => sum + booking.guest_count, 0);
              const hasPrivateBooking = slotBookings.some(booking => booking.booking_type === 'private');
              
              return (
                <div key={timeSlot} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold min-w-[60px]">
                        {formatTime(timeSlot)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {totalGuests}/5 guests
                        </Badge>
                        {hasPrivateBooking && (
                          <Badge className="bg-purple-100 text-purple-800">
                            Private Session
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {slotBookings.length} booking{slotBookings.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {slotBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No bookings for this time slot</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {slotBookings.map(booking => (
                        <div key={booking.id} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-medium">{booking.customer_name}</h4>
                                <Badge className={getBookingTypeColor(booking.booking_type)}>
                                  {booking.booking_type}
                                </Badge>
                                <Badge className={getStatusColor(booking.booking_status)}>
                                  {booking.booking_status}
                                </Badge>
                                <Badge variant="secondary">
                                  {formatServiceType(booking.service_type)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{booking.customer_email}</span>
                                </div>
                                {booking.customer_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{booking.customer_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>{booking.guest_count} guest{booking.guest_count !== 1 ? 's' : ''}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium">£{(booking.price_amount / 100).toFixed(2)}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({booking.payment_status})
                                  </span>
                                </div>
                                
                                {booking.special_requests && (
                                  <div className="text-xs text-muted-foreground max-w-xs truncate">
                                    Note: {booking.special_requests}
                                  </div>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
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
                                  Edit Booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
