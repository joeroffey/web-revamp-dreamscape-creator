import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Mail, Home, Clock, Users, CreditCard } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookingDetails {
  customer_name: string;
  customer_email: string;
  session_date: string;
  session_time: string;
  service_type: string;
  booking_type: string;
  guest_count: number;
  duration_minutes: number;
  price_amount: number;
  final_amount: number | null;
  discount_amount: number;
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("customer_name, customer_email, session_date, session_time, service_type, booking_type, guest_count, duration_minutes, price_amount, final_amount, discount_amount")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (!error && data) {
          setBooking(data);
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getServiceName = (type: string) => {
    const names: Record<string, string> = {
      "combined": "Contrast Therapy (Sauna + Ice Bath)",
      "sauna": "Infrared Sauna",
      "ice_bath": "Ice Bath"
    };
    return names[type] || type;
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
              Booking Confirmed!
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-12">
              Thank you for your booking. We've sent a confirmation email with all the details.
            </p>

            <Card className="wellness-card max-w-2xl mx-auto mb-8">
              <CardContent className="p-8">
                {loading ? (
                  <div className="text-muted-foreground">Loading your booking details...</div>
                ) : booking ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-4">
                      Your Booking Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Date</p>
                        </div>
                        <p className="text-lg font-medium">
                          {formatDate(booking.session_date)}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Time</p>
                        </div>
                        <p className="text-lg font-medium">
                          {formatTime(booking.session_time)}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Session Type</p>
                        </div>
                        <p className="text-lg font-medium capitalize">
                          {booking.booking_type} Session
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Amount Paid</p>
                        </div>
                        <p className="text-lg font-medium">
                          £{((booking.final_amount || booking.price_amount) / 100).toFixed(2)}
                        </p>
                        {booking.discount_amount > 0 && (
                          <p className="text-sm text-primary">
                            You saved £{(booking.discount_amount / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4 text-left">
                      <p className="font-medium text-foreground mb-1">
                        {getServiceName(booking.service_type)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.duration_minutes} minute session
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground pt-4 border-t border-border">
                      <Mail className="h-5 w-5" />
                      <span>Confirmation sent to {booking.customer_email}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-border text-left">
                      <h3 className="font-semibold mb-2">What's Next?</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Arrive 10 minutes before your session</li>
                        <li>• Bring a towel and comfortable clothing</li>
                        <li>• Stay hydrated before and after your session</li>
                        <li>• Contact us if you need to reschedule</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <span>Your session details have been confirmed</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                      <span>Confirmation email sent to your inbox</span>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold mb-2">What's Next?</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Arrive 10 minutes before your session</li>
                        <li>• Bring a towel and comfortable clothing</li>
                        <li>• Stay hydrated before and after your session</li>
                        <li>• Contact us if you need to reschedule</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/booking">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Another Session
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BookingSuccess;
