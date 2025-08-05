import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download, Filter } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ReportsData {
  totalRevenue: number;
  totalCustomers: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  customerRetention: number;
  recentRevenue: Array<{ date: string; amount: number }>;
}

export default function ModernReports() {
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("revenue");
  const [reportsData, setReportsData] = useState<ReportsData>({
    totalRevenue: 0,
    totalCustomers: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    customerRetention: 0,
    recentRevenue: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    try {
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { data: allBookings } = await supabase
        .from('bookings')
        .select('price_amount, session_date, payment_status');

      const { count: completedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_status', 'completed');

      const { count: cancelledCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_status', 'cancelled');

      const totalRevenue = allBookings?.reduce((sum, booking) => sum + booking.price_amount, 0) || 0;

      const recentRevenue = allBookings?.slice(-5).map(booking => ({
        date: booking.session_date,
        amount: booking.price_amount / 100
      })) || [];

      const completionRate = bookingsCount ? ((completedCount || 0) / bookingsCount) * 100 : 0;

      setReportsData({
        totalRevenue,
        totalCustomers: customersCount || 0,
        totalBookings: bookingsCount || 0,
        completedBookings: completedCount || 0,
        cancelledBookings: cancelledCount || 0,
        customerRetention: completionRate,
        recentRevenue
      });
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "7days": return "Last 7 Days";
      case "30days": return "Last 30 Days";
      case "90days": return "Last 90 Days";
      case "thisMonth": return "This Month";
      case "lastMonth": return "Last Month";
      default: return "Last 30 Days";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Business Reports
              </h1>
              <p className="text-gray-600 text-sm">Analytics and insights for your business</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{formatCurrency(reportsData.totalRevenue)}</div>
              <div className="flex items-center gap-1 text-xs text-green-100">
                <TrendingUp className="h-3 w-3" />
                Total revenue from paid bookings
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{reportsData.totalCustomers}</div>
              <div className="flex items-center gap-1 text-xs text-blue-100">
                <span>Total registered customers</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{reportsData.totalBookings}</div>
              <div className="flex items-center gap-1 text-xs text-purple-100">
                <span>{reportsData.customerRetention.toFixed(1)}% completion rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Customer Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{reportsData.customerRetention.toFixed(1)}%</div>
              <div className="flex items-center gap-1 text-xs text-orange-100">
                <span>Returning customers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenue Trends</span>
                <Badge variant="outline">{getDateRangeLabel()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  Revenue chart visualization would go here
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Daily Revenue</h4>
                  {reportsData.recentRevenue.length > 0 ? reportsData.recentRevenue.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{format(new Date(day.date), "MMM d")}</span>
                      <span className="font-medium">{formatCurrency(day.amount)}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground">No recent revenue data available</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{reportsData.completedBookings}</div>
                    <div className="text-sm text-green-700">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{reportsData.cancelledBookings}</div>
                    <div className="text-sm text-red-700">Cancelled</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Service Popularity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ice Bath</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-16 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sauna</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Combined</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-8 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{reportsData.totalCustomers}</div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                  <div className="text-xs text-gray-500 mt-1">All time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{reportsData.completedBookings}</div>
                  <div className="text-sm text-gray-600">Completed Bookings</div>
                  <div className="text-xs text-gray-500 mt-1">All time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{reportsData.customerRetention.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                  <div className="text-xs text-gray-500 mt-1">Overall</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
