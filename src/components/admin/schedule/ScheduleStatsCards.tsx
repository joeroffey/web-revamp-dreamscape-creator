import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  id: string;
  session_date: string;
  session_time: string;
  guest_count: number;
  payment_status: string;
  booking_status: string;
  price_amount: number;
  final_amount?: number;
}

interface ScheduleStatsCardsProps {
  bookings: BookingData[];
  selectedDate: Date;
}

export const ScheduleStatsCards = ({ bookings, selectedDate }: ScheduleStatsCardsProps) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

  const activeBookings = bookings.filter(b => b.booking_status !== 'cancelled');

  const todayBookings = activeBookings.filter(b => b.session_date === today);
  const weekBookings = activeBookings.filter(b => b.session_date >= weekStart && b.session_date <= weekEnd);
  const monthBookings = activeBookings.filter(b => b.session_date >= monthStart && b.session_date <= monthEnd);

  const todayGuests = todayBookings.reduce((sum, b) => sum + b.guest_count, 0);
  const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.final_amount || b.price_amount), 0) / 100;
  const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.final_amount || b.price_amount), 0) / 100;

  const stats = [
    {
      label: "Today's Sessions",
      value: todayBookings.length,
      subtext: `${todayGuests} guests expected`,
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-400/20',
    },
    {
      label: "This Week",
      value: weekBookings.length,
      subtext: `£${weekRevenue.toFixed(0)} revenue`,
      icon: CalendarDays,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-400/20',
    },
    {
      label: "This Month",
      value: monthBookings.length,
      subtext: `£${monthRevenue.toFixed(0)} total`,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-400/20',
    },
    {
      label: "Avg. Daily Guests",
      value: Math.round(monthBookings.reduce((sum, b) => sum + b.guest_count, 0) / Math.max(new Date().getDate(), 1)),
      subtext: `${format(selectedDate, 'MMMM')}`,
      icon: Users,
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-400/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label}
          className={cn(
            "relative overflow-hidden border-0 shadow-lg",
            `bg-gradient-to-br ${stat.gradient}`
          )}
        >
          {/* Decorative circle */}
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-white/70 mt-1">{stat.subtext}</p>
              </div>
              <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
