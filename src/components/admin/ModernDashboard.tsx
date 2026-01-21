import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  PoundSterling, 
  TrendingUp, 
  Gift, 
  CreditCard,
  Clock,
  Star,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { format } from "date-fns";

export default function ModernDashboard() {
  const mockStats = {
    totalCustomers: 247,
    totalBookings: 1834,
    totalRevenue: 45670,
    giftCards: 23,
    memberships: 45,
    todayBookings: 12,
    weeklyGrowth: 15.3,
    monthlyRevenue: 12450
  };

  const recentBookings = [
    {
      id: "1",
      customer_name: "John Smith",
      service_type: "Ice Bath",
      session_time: "10:00",
      status: "confirmed",
      amount: 30
    },
    {
      id: "2",
      customer_name: "Sarah Johnson",
      service_type: "Sauna",
      session_time: "14:00",
      status: "completed",
      amount: 25
    },
    {
      id: "3",
      customer_name: "Mike Wilson",
      service_type: "Combined",
      session_time: "16:30",
      status: "pending",
      amount: 45
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Welcome back! Here's your business overview</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{mockStats.totalCustomers}</div>
              <div className="flex items-center gap-1 text-xs text-blue-100">
                <TrendingUp className="h-3 w-3" />
                +12% this month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{mockStats.totalBookings}</div>
              <div className="flex items-center gap-1 text-xs text-green-100">
                <TrendingUp className="h-3 w-3" />
                +8% this week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{formatCurrency(mockStats.totalRevenue)}</div>
              <div className="flex items-center gap-1 text-xs text-purple-100">
                <TrendingUp className="h-3 w-3" />
                +{mockStats.weeklyGrowth}% growth
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{mockStats.todayBookings}</div>
              <div className="flex items-center gap-1 text-xs text-orange-100">
                <Calendar className="h-3 w-3" />
                {format(new Date(), "MMM d")}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Bookings</span>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {booking.customer_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="text-sm text-gray-600">
                          {booking.service_type} • {booking.session_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'completed' ? 'secondary' :
                        'outline'
                      }>
                        {booking.status}
                      </Badge>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(booking.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-pink-500" />
                  Gift Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600 mb-2">{mockStats.giftCards}</div>
                <p className="text-sm text-gray-600">Active gift cards</p>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Manage Gift Cards
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Memberships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 mb-2">{mockStats.memberships}</div>
                <p className="text-sm text-gray-600">Active memberships</p>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Manage Memberships
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(mockStats.monthlyRevenue)}</div>
                <p className="text-sm text-gray-600">This month's earnings</p>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
