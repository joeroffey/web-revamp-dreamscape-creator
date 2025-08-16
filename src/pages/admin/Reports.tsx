import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Users, Calendar, Download, Filter } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "7days":
        return { start: subDays(now, 7), end: now };
      case "30days":
        return { start: subDays(now, 30), end: now };
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "thisWeek":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-report", dateRange],
    queryFn: async () => {
      // Revenue reporting not implemented yet, return mock data
      console.log("Revenue reporting not implemented yet");
      const mockData = [];
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.random() * 1000 + 500,
          bookings: Math.floor(Math.random() * 10) + 3
        });
      }
      return mockData;
    },
  });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ["service-report", dateRange],
    queryFn: async () => {
      // Service reporting not implemented yet, return mock data
      console.log("Service reporting not implemented yet");
      return [
        { name: "Ice Bath", value: 15, revenue: 450, count: 15 },
        { name: "Sauna", value: 12, revenue: 300, count: 12 },
        { name: "Combined", value: 8, revenue: 400, count: 8 }
      ];
    },
  });

  const { data: customerStats, isLoading: customerLoading } = useQuery({
    queryKey: ["customer-stats", dateRange],
    queryFn: async () => {
      // Customer stats not implemented yet, return mock data
      console.log("Customer stats not implemented yet");
      const mockCustomers = [
        { id: "1", name: "John Smith", type: "vip", totalSpent: 450, bookingCount: 15, avgPerBooking: 30, isNew: false },
        { id: "2", name: "Sarah Johnson", type: "regular", totalSpent: 300, bookingCount: 12, avgPerBooking: 25, isNew: true },
        { id: "3", name: "Mike Wilson", type: "regular", totalSpent: 200, bookingCount: 8, avgPerBooking: 25, isNew: false }
      ];
      
      return {
        topCustomers: mockCustomers,
        newCustomers: 1,
        totalCustomers: 3,
        avgSpentPerCustomer: 316.67
      };
    },
  });

  const { data: summaryStats, isLoading: summaryLoading } = useQuery({
    queryKey: ["summary-stats", dateRange],
    queryFn: async () => {
      // Summary stats not implemented yet, return mock data
      console.log("Summary stats not implemented yet");
      return {
        totalRevenue: 2450.50,
        totalBookings: 35,
        completedBookings: 30,
        cancelledBookings: 3,
        noShowBookings: 2,
        completionRate: 85.7,
        cancellationRate: 8.6
      };
    },
  });

  const exportReport = () => {
    if (!revenueData || !serviceData || !customerStats) return;

    const csvContent = [
      ["Report Type", "Period", `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`],
      [],
      ["Daily Revenue"],
      ["Date", "Revenue", "Bookings"],
      ...revenueData.map((day: any) => [day.date, day.revenue.toFixed(2), day.bookings]),
      [],
      ["Service Performance"],
      ["Service", "Bookings", "Revenue"],
      ...serviceData.map((service: any) => [service.name, service.count, service.revenue.toFixed(2)]),
      [],
      ["Top Customers"],
      ["Name", "Bookings", "Total Spent", "Avg per Booking"],
      ...customerStats.topCustomers.map((customer: any) => [
        customer.name || "Unknown",
        customer.bookingCount,
        customer.totalSpent.toFixed(2),
        customer.avgPerBooking.toFixed(2)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLoading = revenueLoading || serviceLoading || customerLoading || summaryLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Reports</h1>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{summaryStats?.totalRevenue.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">
                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats?.completedBookings || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats?.completionRate.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats?.cancelledBookings || 0} cancelled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats?.newCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {customerStats?.totalCustomers || 0} total active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis tickFormatter={(value) => `£${value}`} />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                      formatter={(value: any) => [`£${value.toFixed(2)}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerStats?.topCustomers.map((customer: any, index: number) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{customer.name || "Unknown Customer"}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.bookingCount} bookings • Avg £{customer.avgPerBooking.toFixed(2)}
                        </div>
                      </div>
                      {customer.type && customer.type !== 'regular' && (
                        <Badge variant="secondary">{customer.type.toUpperCase()}</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">£{customer.totalSpent.toFixed(2)}</div>
                      {customer.isNew && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
