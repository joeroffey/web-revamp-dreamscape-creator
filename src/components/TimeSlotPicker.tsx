import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  service_type: string;
  is_available: boolean;
  booked_count: number;
  capacity: number;
}

interface TimeSlotPickerProps {
  serviceType: string;
  onSlotSelect: (slotId: string, date: string, time: string) => void;
  selectedSlotId?: string;
}

export const TimeSlotPicker = ({ serviceType, onSlotSelect, selectedSlotId }: TimeSlotPickerProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  const fetchTimeSlots = async (date: string) => {
    if (!date || !serviceType) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("slot_date", date)
        .eq("service_type", serviceType)
        .order("slot_time");

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
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

  // Real-time updates for time slots
  useEffect(() => {
    if (!selectedDate || !serviceType) return;

    const channel = supabase
      .channel('time-slots-changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, serviceType]);

  const availableDates = getAvailableDates();

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableDates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                onClick={() => setSelectedDate(date)}
                className="p-3 h-auto flex flex-col"
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times for {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading available times...
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No available times for this date. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="relative">
                    <Button
                      variant={selectedSlotId === slot.id ? "default" : "outline"}
                      onClick={() => slot.is_available && onSlotSelect(slot.id, slot.slot_date, slot.slot_time)}
                      disabled={!slot.is_available}
                      className="w-full p-3 h-auto"
                      size="sm"
                    >
                      {formatTime(slot.slot_time)}
                    </Button>
                    {!slot.is_available && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                      >
                        Booked
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};