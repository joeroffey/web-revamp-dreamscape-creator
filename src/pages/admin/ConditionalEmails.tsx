import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFunctionErrorMessage } from "@/lib/functionError";
import {
  describeTrigger,
  TRIGGER_GROUPS,
  TRIGGER_MAP,
  TRIGGERS,
} from "@/lib/conditionalEmailTriggers";
import {
  ConditionalEmailRuleDialog,
  type MailchimpTemplate,
  type RuleRecord,
} from "@/components/admin/ConditionalEmailRuleDialog";
import { Loader2, Mail, Pencil, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  queued: "secondary",
  sending: "secondary",
  failed: "destructive",
  skipped: "outline",
  cancelled: "outline",
};

export default function ConditionalEmails() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RuleRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [running, setRunning] = useState<"sweep" | "dispatch" | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["conditional-email-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditional_email_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (RuleRecord & { id: string; last_triggered_at: string | null })[];
    },
  });

  const { data: sends = [] } = useQuery({
    queryKey: ["conditional-email-sends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditional_email_sends")
        .select("*, rule:conditional_email_rules(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["mailchimp-templates"],
    queryFn: async (): Promise<MailchimpTemplate[]> => {
      const { data, error } = await supabase.functions.invoke("mailchimp-templates");
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if ((data as any)?.error) throw new Error((data as any).error);
      return ((data as any)?.templates || []) as MailchimpTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("conditional_email_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conditional-email-rules"] }),
    onError: () => toast.error("Could not update the rule"),
  });

  const removeRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conditional_email_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conditional-email-rules"] });
      toast.success("Rule deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Could not delete the rule"),
  });

  const runJob = async (job: "sweep" | "dispatch") => {
    setRunning(job);
    try {
      const fn = job === "sweep" ? "conditional-emails-evaluate" : "conditional-emails-dispatch";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: job === "sweep" ? { mode: "sweep" } : {},
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = data as any;
      toast.success(
        job === "sweep"
          ? `Checked all rules — ${d.queued} queued, ${d.skipped} skipped`
          : `Sent ${d.sent}, failed ${d.failed}, deferred ${d.deferred}`,
      );
      queryClient.invalidateQueries({ queryKey: ["conditional-email-sends"] });
    } catch (error: any) {
      toast.error(error?.message || "Job failed");
    } finally {
      setRunning(null);
    }
  };

  const activeCount = rules.filter((r) => r.is_active).length;
  const queuedCount = sends.filter((s) => s.status === "queued").length;
  const failedCount = sends.filter((s) => s.status === "failed").length;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Conditional Emails"
        description="Send Mailchimp templates automatically when customers hit a condition."
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => runJob("sweep")} disabled={running !== null}>
              {running === "sweep" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Check rules now</span>
            </Button>
            <Button variant="outline" onClick={() => runJob("dispatch")} disabled={running !== null}>
              {running === "dispatch" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-2">Send queued</span>
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New rule
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active rules</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Waiting to send</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{queuedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Failed (last 100)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{failedCount}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Timing</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading rules…
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && rules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Mail className="h-6 w-6 mx-auto mb-2 opacity-60" />
                        No rules yet. Create your first conditional email.
                      </TableCell>
                    </TableRow>
                  )}
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.name}
                        <div className="text-xs text-muted-foreground">{rule.subject}</div>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <span className="text-sm">
                          {describeTrigger(rule.trigger_type, rule.trigger_config)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.template_name || rule.mailchimp_template_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {TRIGGER_MAP[rule.trigger_type]?.kind === "event"
                            ? "Instant"
                            : TRIGGER_MAP[rule.trigger_type]?.kind === "manual"
                              ? "Manual"
                              : "Daily"}
                        </Badge>
                        {rule.delay_minutes > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            +{rule.delay_minutes} min delay
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(v) =>
                            toggleActive.mutate({ id: rule.id, is_active: v })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(rule);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sends.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Nothing sent yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {sends.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{s.customer_email}</TableCell>
                      <TableCell className="text-sm">{s.rule?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[s.status] || "outline"}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(s.sent_at || s.scheduled_for || s.created_at).toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {s.error || s.mailchimp_campaign_id || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What each trigger does</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Trigger</TableHead>
                    <TableHead>What it does</TableHead>
                    <TableHead className="w-[100px]">Timing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TRIGGER_GROUPS.map((group) => (
                    <>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-semibold text-sm py-2">
                          {group}
                        </TableCell>
                      </TableRow>
                      {TRIGGERS.filter((t) => t.group === group).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-sm align-top">{t.label}</TableCell>
                          <TableCell className="text-sm text-muted-foreground align-top">
                            {t.description}
                            {t.fields && t.fields.length > 0 && (
                              <div className="mt-1 text-xs text-foreground/70">
                                Configurable: {t.fields.map((f) => f.label).join(", ")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm align-top whitespace-nowrap">
                            <Badge variant="secondary">
                              {t.kind === "event" ? "Instant" : t.kind === "manual" ? "Manual" : "Daily"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Filters & timing options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Only send to</strong> — Limit the rule to active members, non-members, or any customer.
                </p>
                <p>
                  <strong className="text-foreground">Minimum lifetime spend</strong> — Only send to customers who have spent at least this much in total.
                </p>
                <p>
                  <strong className="text-foreground">Customer tag</strong> — Only send if the customer has a specific admin tag (e.g. VIP).
                </p>
                <p>
                  <strong className="text-foreground">Wait before sending</strong> — Delays the email by the chosen number of minutes after the trigger fires.
                </p>
                <p>
                  <strong className="text-foreground">How often per customer</strong> — Choose once ever, once every N days, or every time the condition occurs.
                </p>
                <p>
                  <strong className="text-foreground">Mailchimp tag to apply</strong> — Tags the customer in Mailchimp when the email sends, so you can build segments and journeys.
                </p>
                <p>
                  <strong className="text-foreground">Daily cap</strong> — Stops the rule after the chosen number of sends in one day, protecting against misconfiguration.
                </p>
                <p>
                  <strong className="text-foreground">Respect quiet hours</strong> — Holds emails until 08:00–20:00 local time so nobody is woken up.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How customers are linked</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Matching</strong> — Customers are matched to Mailchimp by their lowercased email address, the same way the existing Mailchimp sync works.
                </p>
                <p>
                  <strong className="text-foreground">Auto-add</strong> — If a customer is not already in your Mailchimp audience, their email, first name and last name are added automatically before the send.
                </p>
                <p>
                  <strong className="text-foreground">Tagging</strong> — The rule's Mailchimp tag is applied on send, so you can build Mailchimp segments and journeys from the same conditions.
                </p>
                <p>
                  <strong className="text-foreground">Unsubscribed</strong> — Unsubscribed customers are skipped and logged as "skipped — unsubscribed". They are not re-subscribed.
                </p>
                <p>
                  <strong className="text-foreground">Timing types</strong> — Instant triggers fire from booking/payment events. Daily triggers are checked once a day around 7am. Manual triggers only run when you choose.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConditionalEmailRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        templates={templates}
        templatesLoading={templatesLoading}
        templatesError={templatesError ? (templatesError as Error).message : null}
        onRefreshTemplates={() => refetchTemplates()}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["conditional-email-rules"] })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
            <AlertDialogDescription>
              The rule and its send history will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && removeRule.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
