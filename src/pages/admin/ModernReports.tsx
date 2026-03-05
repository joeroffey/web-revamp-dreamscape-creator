import React, { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, TrendingUp, Users, CalendarDays, PoundSterling, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatGBP } from "@/lib/format";
import { AdminDateRangeKey, getDateRange } from "@/lib/dateRange";

type ReportRow = {
  source: "booking" | "gift_card" | "membership";
  created_at: string;
  reference: string;
  customer: string;
  description: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
};

export default function ModernReports() {
  const [rangeKey, setRangeKey] = useState<AdminDateRangeKey>("30days");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<Record<string, { count: number; revenue: number }>>({});

  useEffect(() => {
    void fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(rangeKey);
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      const [bookingsRes, giftRes, membershipsRes, promoRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, created_at, customer_name, customer_email, service_type, booking_type, price_amount, discount_amount, final_amount, payment_status")
          .eq("payment_status", "paid")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false }),
        supabase
          .from("gift_cards")
          .select("id, created_at, purchaser_name, purchaser_email, amount, discount_amount, final_amount, payment_status")
          .eq("payment_status", "paid")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false }),
        supabase
          .from("memberships")
          .select("id, created_at, user_id, membership_type, price_amount, discount_amount, status")
          .eq("status", "active")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false }),
        supabase
          .from("discount_redemptions")
          .select("discount_amount, created_at")
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (giftRes.error) throw giftRes.error;
      if (membershipsRes.error) throw membershipsRes.error;
      if (promoRes.error) throw promoRes.error;

      const bookingRows: ReportRow[] = (bookingsRes.data || []).map((b: any) => {
        const original = Number(b.price_amount || 0);
        const discount = Number(b.discount_amount || 0);
        const final = Number(b.final_amount ?? original - discount);
        return {
          source: "booking",
          created_at: b.created_at,
          reference: b.id,
          customer: b.customer_email || b.customer_name || "—",
          description: `${String(b.service_type || "service").replace(/_/g, " ")} • ${b.booking_type || "communal"}`,
          original_amount: original,
          discount_amount: discount,
          final_amount: final,
        };
      });

      const giftRows: ReportRow[] = (giftRes.data || []).map((g: any) => {
        const original = Number(g.amount || 0);
        const discount = Number(g.discount_amount || 0);
        const final = Number(g.final_amount ?? original - discount);
        return {
          source: "gift_card",
          created_at: g.created_at,
          reference: g.id,
          customer: g.purchaser_email || g.purchaser_name || "—",
          description: "Gift card purchase",
          original_amount: original,
          discount_amount: discount,
          final_amount: final,
        };
      });

      const membershipRows: ReportRow[] = (membershipsRes.data || []).map((m: any) => {
        const original = Number(m.price_amount || 0);
        const discount = Number(m.discount_amount || 0);
        const final = Math.max(0, original - discount);
        return {
          source: "membership",
          created_at: m.created_at,
          reference: m.id,
          customer: String(m.user_id || "—"),
          description: `Membership • ${String(m.membership_type || "plan").replace(/_/g, " ")}`,
          original_amount: original,
          discount_amount: discount,
          final_amount: final,
        };
      });

      const all = [...bookingRows, ...giftRows, ...membershipRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRows(all);

      // Service breakdown by booking type (communal vs private)
      const breakdown: Record<string, { count: number; revenue: number }> = {};
      for (const b of bookingsRes.data || []) {
        const bookingType = String(b.booking_type || "communal");
        const key = bookingType === 'private' ? 'Private Session' : 'Communal Session';
        const original = Number(b.price_amount || 0);
        const discount = Number(b.discount_amount || 0);
        const final = Number(b.final_amount ?? original - discount);
        if (!breakdown[key]) breakdown[key] = { count: 0, revenue: 0 };
        breakdown[key].count += 1;
        breakdown[key].revenue += final;
      }
      setServiceBreakdown(breakdown);

      // Promo savings are represented in rows + promo ledger; we keep a single number below in stats
      // (promoRes is used in memo'd stats)
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.final_amount, 0);
    const totalDiscount = rows.reduce((s, r) => s + r.discount_amount, 0);
    const totalTransactions = rows.length;
    const uniqueCustomers = new Set(rows.map(r => r.customer).filter(Boolean)).size;
    return { totalRevenue, totalDiscount, totalTransactions, uniqueCustomers };
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "created_at",
      "source",
      "reference",
      "customer",
      "description",
      "original_amount_pence",
      "discount_amount_pence",
      "final_amount_pence",
    ];

    const lines = rows.map(r => [
      r.created_at,
      r.source,
      r.reference,
      r.customer,
      r.description,
      r.original_amount,
      r.discount_amount,
      r.final_amount,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revitalise-reports-${rangeKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabel: Record<AdminDateRangeKey, string> = {
    "7days": "Last 7 days",
    "30days": "Last 30 days",
    "90days": "Last 90 days",
    "thisMonth": "This month",
    "lastMonth": "Last month",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Reports"
          description="Real booking, gift card, and membership revenue with discounts and exports."
          right={
            <div className="flex gap-2">
              <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as AdminDateRangeKey)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="thisMonth">This month</SelectItem>
                  <SelectItem value="lastMonth">Last month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv} disabled={loading || rows.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading report data…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <PoundSterling className="h-4 w-4" /> Revenue ({rangeLabel[rangeKey]})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatGBP(stats.totalRevenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Discounts applied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatGBP(stats.totalDiscount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stats.totalTransactions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> Unique customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stats.uniqueCustomers}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Bookings by service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.keys(serviceBreakdown).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No paid bookings in this range.</div>
                  ) : (
                    Object.entries(serviceBreakdown)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([key, v]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium">{key}</div>
                            <div className="text-xs text-muted-foreground">{v.count} bookings</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatGBP(v.revenue)}</div>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions found in this date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.slice(0, 50).map((r) => (
                          <TableRow key={`${r.source}_${r.reference}`}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString("en-GB")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{r.source.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate">{r.customer}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{r.description}</TableCell>
                            <TableCell className="text-right font-medium">{formatGBP(r.final_amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {rows.length > 50 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Showing latest 50 transactions. Use Export CSV for full data.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
