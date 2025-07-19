import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  service_type: string;
  is_available: boolean;
  booked_count: number;
  capacity: number;
  available_spaces?: number;
  has_private_booking?: boolean;
  total_communal_guests?: number;
  bookings?: Array<{
    booking_type: string;
    guest_count: number;
    payment_status: string;
  }>;
}

interface TimeSlotPickerProps {
  serviceType: string;
  onSlotSelect: (slotId: string, date: string, time: string, availableSpaces?: number) => void;
  selectedSlotId?: string;
}

export const TimeSlotPicker = ({ serviceType, onSlotSelect, selectedSlotId }: TimeSlotPickerProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  // Get available dates for the next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (day 0)
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds
  };

  const isSlotInPast = (slotDate: string, slotTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Only check for past times if the slot is today
    if (slotDate !== today) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotTimeInMinutes = hours * 60 + minutes;
    
    return slotTimeInMinutes <= currentTime;
  };

  const fetchTimeSlots = async (date: string) => {
    if (!date || !serviceType) return;
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Fetching time slots for:", { date, serviceType });
      
      // First, get time slots with booking information
      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("slot_date", date)
        .eq("service_type", serviceType)
        .order("slot_time");

      if (slotsError) {
        throw new Error(`Failed to fetch time slots: ${slotsError.message}`);
      }

      let slots = slotsData || [];
      
      // If no slots exist, generate them
      if (slots.length === 0) {
        console.log("No time slots found, attempting to generate slots for:", date);
        
        const { error: generateError } = await supabase.rpc('generate_time_slots', {
          start_date: date,
          end_date: date
        });
        
        if (generateError) {
          console.error("Error generating time slots:", generateError);
        } else {
          // Retry fetching after generation
          const { data: retryData, error: retryError } = await supabase
            .from("time_slots")
            .select("*")
            .eq("slot_date", date)
            .eq("service_type", serviceType)
            .order("slot_time");
            
          if (!retryError && retryData) {
            slots = retryData;
            console.log("Generated and fetched time slots:", retryData);
          }
        }
      }

      // Now get booking information for each slot
      const slotsWithBookings = await Promise.all(
        slots.map(async (slot) => {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("booking_type, guest_count, payment_status")
            .eq("time_slot_id", slot.id)
            .eq("payment_status", "paid");

          const confirmedBookings = bookings || [];
          const communalBookings = confirmedBookings.filter(b => b.booking_type === 'communal');
          const privateBookings = confirmedBookings.filter(b => b.booking_type === 'private');
          
          const totalCommunalGuests = communalBookings.reduce((sum, b) => sum + (b.guest_count || 0), 0);
          const hasPrivateBooking = privateBookings.length > 0;
          
          let availableSpaces = 0;
          let isAvailable = false;
          
          if (hasPrivateBooking) {
            availableSpaces = 0;
            isAvailable = false;
          } else {
            availableSpaces = Math.max(0, 5 - totalCommunalGuests);
            isAvailable = availableSpaces > 0;
          }
          
          return {
            ...slot,
            available_spaces: availableSpaces,
            is_available: isAvailable,
            has_private_booking: hasPrivateBooking,
            total_communal_guests: totalCommunalGuests,
            bookings: confirmedBookings
          };
        })
      );
      
      setTimeSlots(slotsWithBookings);
      console.log("Time slots with availability:", slotsWithBookings);
      
    } catch (error) {
      console.error("Error fetching time slots:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load available times";
      setError(errorMessage);
      setTimeSlots([]);
      
      toast({
        title: "Error Loading Times",
        description: "Unable to load available time slots. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  };

  useEffect(() => {
    if (selectedDate && serviceType) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate, serviceType]);

  useEffect(() => {
    // Set default date to today if available, otherwise first available date
    const availableDates = getAvailableDates();
    const today = new Date().toISOString().split('T')[0];
    
    if (availableDates.includes(today)) {
      setSelectedDate(today);
    } else if (availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, []);

  // Real-time updates for time slots with better cleanup
  useEffect(() => {
    if (!selectedDate || !serviceType) return;

    let channel: any = null;

    try {
      channel = supabase
        .channel(`time-slots-${selectedDate}-${serviceType}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_slots',
            filter: `slot_date=eq.${selectedDate},service_type=eq.${serviceType}`
          },
          () => {
            // Refetch time slots when changes occur
            fetchTimeSlots(selectedDate);
          }
        )
        .subscribe();
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error("Error cleaning up channel:", error);
        }
      }
    };
  }, [selectedDate, serviceType]);

  const availableDates = getAvailableDates();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Selection */}
      <Card className="wellness-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {availableDates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                onClick={() => setSelectedDate(date)}
                className="p-2 sm:p-3 h-auto flex flex-col text-xs sm:text-sm"
                size="sm"
              >
                <span className="text-xs opacity-75">
                  {formatDate(date).split(' ')[0]}
                </span>
                <span className="font-medium">
                  {formatDate(date).split(' ').slice(1).join(' ')}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      {selectedDate && (
        <Card className="wellness-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Available Times for {formatDate(selectedDate)}
              </CardTitle>
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading available times...
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available times for this date.</p>
                <p className="text-sm mt-2">Please select another date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const isPastSlot = isSlotInPast(slot.slot_date, slot.slot_time);
                  const isDisabled = !slot.is_available || isPastSlot;
                  
                  return (
                    <div key={slot.id} className="relative">
                      <Button
                        variant={selectedSlotId === slot.id ? "default" : "outline"}
                        onClick={() => !isDisabled && onSlotSelect(slot.id, slot.slot_date, slot.slot_time, slot.available_spaces)}
                        disabled={isDisabled}
                        className={`w-full p-2 sm:p-3 h-auto text-sm flex flex-col gap-1 ${
                          isPastSlot ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        size="sm"
                      >
                        <span>{formatTime(slot.slot_time)}</span>
                        {slot.has_private_booking ? (
                          <span className="text-xs opacity-70">Private</span>
                        ) : (
                          <span className="text-xs opacity-70">
                            {slot.available_spaces || 0}/5 spaces
                          </span>
                        )}
                      </Button>
                      {!slot.is_available && !isPastSlot && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-xs px-1 sm:px-1.5 py-0.5"
                        >
                          Full
                        </Badge>
                      )}
                      {isPastSlot && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-xs px-1 sm:px-1.5 py-0.5 opacity-60"
                        >
                          Past
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};