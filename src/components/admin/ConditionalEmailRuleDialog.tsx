import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFunctionErrorMessage } from "@/lib/functionError";
import {
  MEMBERSHIP_FILTERS,
  REPEAT_POLICIES,
  TRIGGERS,
  TRIGGER_GROUPS,
  TRIGGER_MAP,
  describeTrigger,
} from "@/lib/conditionalEmailTriggers";

export interface RuleRecord {
  id?: string;
  name: string;
  mailchimp_template_id: string;
  template_name: string | null;
  subject: string;
  from_name: string | null;
  reply_to: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  filters: Record<string, any>;
  delay_minutes: number;
  repeat_policy: string;
  repeat_window_days: number | null;
  mailchimp_tag: string | null;
  quiet_hours_enabled: boolean;
  daily_cap: number | null;
  is_active: boolean;
}

export interface MailchimpTemplate {
  id: string;
  name: string;
}

const emptyRule = (): RuleRecord => ({
  name: "",
  mailchimp_template_id: "",
  template_name: null,
  subject: "",
  from_name: null,
  reply_to: null,
  trigger_type: "booking_created",
  trigger_config: {},
  filters: {},
  delay_minutes: 0,
  repeat_policy: "once_ever",
  repeat_window_days: 30,
  mailchimp_tag: null,
  quiet_hours_enabled: true,
  daily_cap: null,
  is_active: true,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RuleRecord | null;
  templates: MailchimpTemplate[];
  templatesLoading: boolean;
  templatesError?: string | null;
  onRefreshTemplates: () => void;
  onSaved: () => void;
}

export function ConditionalEmailRuleDialog({
  open,
  onOpenChange,
  rule,
  templates,
  templatesLoading,
  templatesError,
  onRefreshTemplates,
  onSaved,
}: Props) {
  const [form, setForm] = useState<RuleRecord>(emptyRule());
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) setForm(rule ? { ...emptyRule(), ...rule } : emptyRule());
  }, [open, rule]);

  const trigger = TRIGGER_MAP[form.trigger_type];
  const fields = trigger?.fields || [];

  const grouped = useMemo(
    () =>
      TRIGGER_GROUPS.map((group) => ({
        group,
        items: TRIGGERS.filter((t) => t.group === group),
      })).filter((g) => g.items.length > 0),
    [],
  );

  const setField = (patch: Partial<RuleRecord>) => setForm((f) => ({ ...f, ...patch }));
  const setConfig = (key: string, value: any) =>
    setForm((f) => ({ ...f, trigger_config: { ...f.trigger_config, [key]: value } }));
  const setFilter = (key: string, value: any) =>
    setForm((f) => {
      const filters = { ...f.filters };
      if (value === undefined || value === "" || value === "any") delete filters[key];
      else filters[key] = value;
      return { ...f, filters };
    });

  const handleTriggerChange = (triggerType: string) => {
    const def = TRIGGER_MAP[triggerType];
    const config: Record<string, any> = {};
    for (const field of def?.fields || []) config[field.key] = field.default;
    setForm((f) => ({ ...f, trigger_type: triggerType, trigger_config: config }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Give the rule a name";
    if (!form.mailchimp_template_id) return "Choose a Mailchimp template";
    if (!form.subject.trim()) return "Add a subject line";
    if (form.reply_to && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.reply_to)) {
      return "Reply-to must be a valid email address";
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        mailchimp_template_id: form.mailchimp_template_id,
        template_name:
          templates.find((t) => String(t.id) === String(form.mailchimp_template_id))?.name ??
          form.template_name,
        subject: form.subject.trim(),
        from_name: form.from_name?.trim() || null,
        reply_to: form.reply_to?.trim() || null,
        trigger_type: form.trigger_type,
        trigger_config: form.trigger_config || {},
        filters: form.filters || {},
        delay_minutes: Number(form.delay_minutes) || 0,
        repeat_policy: form.repeat_policy,
        repeat_window_days:
          form.repeat_policy === "once_per_window" ? Number(form.repeat_window_days) || 30 : null,
        mailchimp_tag: form.mailchimp_tag?.trim() || null,
        quiet_hours_enabled: form.quiet_hours_enabled,
        daily_cap: form.daily_cap ? Number(form.daily_cap) : null,
        is_active: form.is_active,
      };

      if (rule?.id) {
        const { error } = await supabase
          .from("conditional_email_rules")
          .update(payload)
          .eq("id", rule.id);
        if (error) throw error;
        toast.success("Rule updated");
      } else {
        const { error } = await supabase.from("conditional_email_rules").insert(payload);
        if (error) throw error;
        toast.success("Rule created");
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save the rule");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail)) {
      toast.error("Enter a valid email address to test with");
      return;
    }
    if (!form.mailchimp_template_id || !form.subject.trim()) {
      toast.error("Choose a template and subject line first");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("conditional-emails-test-send", {
        body: {
          email: testEmail.trim(),
          rule_id: rule?.id,
          template_id: form.mailchimp_template_id,
          subject: form.subject.trim(),
          from_name: form.from_name,
          reply_to: form.reply_to,
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      toast.error(error?.message || "Test send failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "Edit rule" : "New conditional email"}</DialogTitle>
          <DialogDescription>
            Pick a template you designed in Mailchimp, then choose when it should go out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Rule name</Label>
            <Input
              value={form.name}
              onChange={(e) => setField({ name: e.target.value })}
              placeholder="e.g. Thanks for your 3rd session"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mailchimp template</Label>
              <Button variant="ghost" size="sm" onClick={onRefreshTemplates} disabled={templatesLoading}>
                {templatesLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
            <Select
              value={form.mailchimp_template_id ? String(form.mailchimp_template_id) : undefined}
              onValueChange={(v) => setField({ mailchimp_template_id: v })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={templatesLoading ? "Loading templates…" : "Choose a template"}
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templatesError && <p className="text-sm text-destructive">{templatesError}</p>}
            {!templatesError && !templatesLoading && templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No templates found — create one in Mailchimp first.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Subject line</Label>
              <Input
                value={form.subject}
                onChange={(e) => setField({ subject: e.target.value })}
                placeholder="Your next session is on us"
              />
            </div>
            <div className="space-y-2">
              <Label>From name (optional)</Label>
              <Input
                value={form.from_name || ""}
                onChange={(e) => setField({ from_name: e.target.value })}
                placeholder="Revitalise Hub"
              />
            </div>
            <div className="space-y-2">
              <Label>Reply-to (optional)</Label>
              <Input
                type="email"
                value={form.reply_to || ""}
                onChange={(e) => setField({ reply_to: e.target.value })}
                placeholder="hello@revitalisehub.co.uk"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Send this when…</Label>
            <Select value={form.trigger_type} onValueChange={handleTriggerChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {grouped.map((g) => (
                  <SelectGroup key={g.group}>
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.items.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {describeTrigger(form.trigger_type, form.trigger_config)}
            </p>
            {trigger && (
              <Badge variant="secondary" className="mt-1">
                {trigger.kind === "event"
                  ? "Sends straight away"
                  : trigger.kind === "manual"
                    ? "Manual only"
                    : "Checked by the daily job"}
              </Badge>
            )}
          </div>

          {fields.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type === "text" ? "text" : "number"}
                    min={field.min}
                    value={form.trigger_config?.[field.key] ?? field.default}
                    onChange={(e) =>
                      setConfig(
                        field.key,
                        field.type === "text" ? e.target.value : Number(e.target.value),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Only send to</Label>
              <Select
                value={form.filters?.membership || "any"}
                onValueChange={(v) => setFilter("membership", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERSHIP_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimum lifetime spend (£, optional)</Label>
              <Input
                type="number"
                min={0}
                value={form.filters?.min_lifetime_spend ?? ""}
                onChange={(e) =>
                  setFilter(
                    "min_lifetime_spend",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Customer tag (optional)</Label>
              <Input
                value={form.filters?.tag ?? ""}
                onChange={(e) => setFilter("tag", e.target.value)}
                placeholder="vip"
              />
            </div>
            <div className="space-y-2">
              <Label>Wait before sending (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={form.delay_minutes}
                onChange={(e) => setField({ delay_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>How often per customer</Label>
              <Select value={form.repeat_policy} onValueChange={(v) => setField({ repeat_policy: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPEAT_POLICIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.repeat_policy === "once_per_window" && (
              <div className="space-y-2">
                <Label>Days between repeats</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.repeat_window_days ?? 30}
                  onChange={(e) => setField({ repeat_window_days: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Mailchimp tag to apply (optional)</Label>
              <Input
                value={form.mailchimp_tag || ""}
                onChange={(e) => setField({ mailchimp_tag: e.target.value })}
                placeholder="3+ sessions"
              />
            </div>
            <div className="space-y-2">
              <Label>Daily cap for this rule (optional)</Label>
              <Input
                type="number"
                min={1}
                value={form.daily_cap ?? ""}
                onChange={(e) =>
                  setField({ daily_cap: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.quiet_hours_enabled}
                onCheckedChange={(v) => setField({ quiet_hours_enabled: v })}
              />
              <span className="text-sm">Respect quiet hours</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setField({ is_active: v })} />
              <span className="text-sm">Rule active</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Send a test</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button variant="outline" onClick={sendTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Test</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The test uses the template and subject above, prefixed with [TEST].
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rule?.id ? "Save changes" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
