import { useState, useEffect, useMemo, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DailyScheduleView } from "@/components/admin/DailyScheduleView";
import { EnhancedCreateBookingDialog } from "@/components/admin/EnhancedCreateBookingDialog";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Users, CalendarCheck } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday, isWeekend } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

export default function ModernScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekAnchor, setWeekAnchor] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [weekCounts, setWeekCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const stripRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekAnchor, i)),
    [weekAnchor]
  );

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  useEffect(() => {
    fetchWeekCounts();
  }, [weekAnchor]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("session_date", dateStr)
        .eq("payment_status", "paid")
        .order("session_time", { ascending: true });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekCounts = async () => {
    const start = format(weekAnchor, "yyyy-MM-dd");
    const end = format(addDays(weekAnchor, 13), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("session_date")
      .gte("session_date", start)
      .lte("session_date", end)
      .eq("payment_status", "paid");
    const counts: Record<string, number> = {};
    (data || []).forEach((b: any) => {
      counts[b.session_date] = (counts[b.session_date] || 0) + 1;
    });
    setWeekCounts(counts);
  };

  const totalGuests = bookings.reduce((s, b) => s + (b.guest_count || 0), 0);

  const shiftWeek = (dir: number) => setWeekAnchor((d) => addDays(d, dir * 7));

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setWeekAnchor(startOfWeek(today, { weekStartsOn: 1 }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Schedule"
          description={format(selectedDate, "EEEE, MMMM d, yyyy")}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={jumpToToday} className="min-h-[44px]">
                Today
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-h-[44px]">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Jump to date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        setSelectedDate(d);
                        setWeekAnchor(startOfWeek(d, { weekStartsOn: 1 }));
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => setShowCreateDialog(true)} className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Create booking
              </Button>
            </div>
          }
        />

        {/* Modern date strip */}
        <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftWeek(-1)}
              className="rounded-full shrink-0"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div
              ref={stripRef}
              className="flex-1 grid grid-cols-7 sm:grid-cols-14 gap-2 overflow-x-auto scrollbar-hide"
            >
              {weekDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const count = weekCounts[key] || 0;
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                        : "bg-background border-border/60",
                      weekend && !selected && "opacity-90"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-medium",
                        selected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "EEE")}
                    </span>
                    <span className="text-lg font-semibold leading-tight mt-0.5">
                      {format(day, "d")}
                    </span>
                    <div className="h-1.5 mt-1 flex items-center gap-0.5">
                      {count > 0 ? (
                        <>
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              selected ? "bg-primary-foreground" : "bg-primary"
                            )}
                          />
                          {count > 1 && (
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                selected ? "bg-primary-foreground/70" : "bg-primary/70"
                              )}
                            />
                          )}
                          {count > 3 && (
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                selected ? "bg-primary-foreground/40" : "bg-primary/40"
                              )}
                            />
                          )}
                        </>
                      ) : (
                        <span className="h-1.5 w-1.5" />
                      )}
                    </div>
                    {today && !selected && (
                      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftWeek(1)}
              className="rounded-full shrink-0"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Inline stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Bookings</div>
              <div className="text-2xl font-semibold leading-tight">{bookings.length}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Guests</div>
              <div className="text-2xl font-semibold leading-tight">{totalGuests}</div>
            </div>
          </div>
        </div>

        {/* Daily schedule */}
        {loading ? (
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        ) : (
          <DailyScheduleView
            selectedDate={selectedDate}
            bookings={bookings}
            onRefresh={fetchBookings}
          />
        )}

        <EnhancedCreateBookingDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              fetchBookings();
              fetchWeekCounts();
            }
          }}
          selectedDate={selectedDate}
        />
      </div>
    </AdminLayout>
  );
}
