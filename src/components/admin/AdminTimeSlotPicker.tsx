import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface AdminTimeSlotPickerProps {
  serviceType: string;
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string, timeSlotId?: string) => void;
}

export function AdminTimeSlotPicker({
  serviceType,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: AdminTimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '19:00', closed: true },
    tuesday: { open: '08:30', close: '20:00', closed: false },
    wednesday: { open: '08:30', close: '20:00', closed: false },
    thursday: { open: '08:30', close: '20:00', closed: false },
    friday: { open: '08:30', close: '20:00', closed: false },
    saturday: { open: '08:30', close: '20:00', closed: false },
    sunday: { open: '09:00', close: '16:00', closed: false }
  });
  const [businessHoursLoaded, setBusinessHoursLoaded] = useState(false);

  // Fetch business hours from system_settings
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        const { data: settings } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'business_hours')
          .single();

        if (settings?.setting_value) {
          setBusinessHours(settings.setting_value as BusinessHours);
        }
      } catch (error) {
        console.error('Error fetching business hours:', error);
      } finally {
        setBusinessHoursLoaded(true);
      }
    };

    fetchBusinessHours();
  }, []);

  const getDayName = (dayIndex: number): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  };

  const isDayOpen = (date: Date): boolean => {
    const dayName = getDayName(date.getDay());
    const dayHours = businessHours[dayName];
    return dayHours && !dayHours.closed;
  };

  const getHoursForDate = (dateString: string): { open: string; close: string } | null => {
    const date = new Date(dateString);
    const dayName = getDayName(date.getDay());
    const dayHours = businessHours[dayName];
    
    if (!dayHours || dayHours.closed) {
      return null;
    }
    
    return { open: dayHours.open, close: dayHours.close };
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (isDayOpen(date)) {
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
    return timeString.slice(0, 5);
  };

  const isSlotInPast = (slotDate: string, slotTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (slotDate !== today) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotTimeInMinutes = hours * 60 + minutes;
    
    return slotTimeInMinutes <= currentTime;
  };

  const isSlotWithinBusinessHours = (slotDate: string, slotTime: string): boolean => {
    const hours = getHoursForDate(slotDate);
    if (!hours) return false;
    
    const slotTimeStr = slotTime.slice(0, 5);
    const [slotHour, slotMin] = slotTimeStr.split(':').map(Number);
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    const slotMinutes = slotHour * 60 + slotMin;
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return slotMinutes >= openMinutes && slotMinutes < closeMinutes;
  };

  const fetchTimeSlots = async (date: string) => {
    if (!date || !serviceType) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Always query "combined" service type - all sessions use the same time slots
      const dbServiceType = "combined";
      
      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("slot_date", date)
        .eq("service_type", dbServiceType)
        .order("slot_time");

      if (slotsError) {
        throw new Error(`Failed to fetch time slots: ${slotsError.message}`);
      }

      let slots = slotsData || [];
      
      if (slots.length === 0) {
        const { error: generateError } = await supabase.rpc('generate_time_slots', {
          start_date: date,
          end_date: date
        });
        
        if (!generateError) {
          const { data: retryData, error: retryError } = await supabase
            .from("time_slots")
            .select("*")
            .eq("slot_date", date)
            .eq("service_type", dbServiceType)
            .order("slot_time");
            
          if (!retryError && retryData) {
            slots = retryData;
          }
        }
      }

      const slotsWithBookings = await Promise.all(
        slots.map(async (slot) => {
          // Include both paid AND pending (unpaid) bookings - they all reserve spaces
          const { data: bookings } = await supabase
            .from("bookings")
            .select("booking_type, guest_count, payment_status")
            .eq("time_slot_id", slot.id)
            .in("payment_status", ["paid", "pending"]);

          const activeBookings = bookings || [];
          const communalBookings = activeBookings.filter(b => b.booking_type === 'communal');
          const privateBookings = activeBookings.filter(b => b.booking_type === 'private');
          
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
          };
        })
      );
      
      const filteredSlots = slotsWithBookings.filter(slot => 
        isSlotWithinBusinessHours(slot.slot_date, slot.slot_time)
      );
      
      setTimeSlots(filteredSlots);
      
    } catch (error) {
      console.error("Error fetching time slots:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load available times";
      setError(errorMessage);
      setTimeSlots([]);
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
    if (selectedDate && serviceType && businessHoursLoaded) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate, serviceType, businessHoursLoaded]);

  useEffect(() => {
    if (!businessHoursLoaded) return;
    
    const availableDates = getAvailableDates();
    const today = new Date().toISOString().split('T')[0];
    
    if (!selectedDate) {
      if (availableDates.includes(today)) {
        onDateChange(today);
      } else if (availableDates.length > 0) {
        onDateChange(availableDates[0]);
      }
    }
  }, [businessHoursLoaded]);

  const availableDates = getAvailableDates();

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
            {availableDates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                onClick={() => onDateChange(date)}
                className="p-2 h-auto flex flex-col text-xs"
                size="sm"
              >
                <span className="opacity-75">
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Available Times
              </CardTitle>
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-1 h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-4">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading times...
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No times available for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => {
                  const isPastSlot = isSlotInPast(slot.slot_date, slot.slot_time);
                  const isDisabled = !slot.is_available || isPastSlot;
                  const isSelected = selectedTime === slot.slot_time;
                  
                  return (
                    <div key={slot.id} className="relative">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => !isDisabled && onTimeChange(slot.slot_time, slot.id)}
                        disabled={isDisabled}
                        className={`w-full p-2 h-auto text-xs flex flex-col gap-0.5 ${
                          isPastSlot ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        size="sm"
                      >
                        <span className="font-medium">{formatTime(slot.slot_time)}</span>
                        {slot.has_private_booking ? (
                          <span className="opacity-70">Private</span>
                        ) : (
                          <span className="opacity-70">
                            {slot.available_spaces || 0}/5 spaces
                          </span>
                        )}
                      </Button>
                      {!slot.is_available && !isPastSlot && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 text-[10px] px-1 py-0"
                        >
                          Full
                        </Badge>
                      )}
                      {isPastSlot && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-[10px] px-1 py-0 opacity-60"
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
}
