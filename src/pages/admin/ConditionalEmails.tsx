import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Save } from 'lucide-react';

const SETTING_KEY = 'conditional_emails';

type EmailRule = {
  key: string;
  label: string;
  description: string;
};

const RULE_GROUPS: { group: string; rules: EmailRule[] }[] = [
  {
    group: 'Bookings',
    rules: [
      {
        key: 'booking_confirmation',
        label: 'Booking confirmation',
        description: 'Sent to the customer once a session payment is confirmed.',
      },
      {
        key: 'booking_cancellation',
        label: 'Booking cancellation',
        description: 'Sent when a customer or admin cancels a session.',
      },
      {
        key: 'booking_reschedule',
        label: 'Booking reschedule',
        description: 'Sent when a session is moved to a new date or time.',
      },
      {
        key: 'admin_booking_notification',
        label: 'Admin booking alert',
        description: 'Internal notification to the hub whenever a new booking is made.',
      },
    ],
  },
  {
    group: 'Memberships',
    rules: [
      {
        key: 'membership_confirmation',
        label: 'Membership confirmation',
        description: 'Welcome email sent when a membership starts.',
      },
      {
        key: 'membership_renewal',
        label: 'Membership renewal receipt',
        description: 'Sent each month when a subscription payment succeeds.',
      },
      {
        key: 'membership_cancellation',
        label: 'Membership cancellation',
        description: 'Sent when a membership is cancelled or ends.',
      },
    ],
  },
  {
    group: 'Gift cards & credits',
    rules: [
      {
        key: 'gift_card_purchase',
        label: 'Gift card purchase',
        description: 'Sent to the purchaser with their receipt.',
      },
      {
        key: 'gift_card_recipient',
        label: 'Gift card delivery',
        description: 'Sent to the recipient with their gift code.',
      },
      {
        key: 'credit_redemption',
        label: 'Credit redemption',
        description: 'Sent when gift card credit is redeemed against a session.',
      },
    ],
  },
  {
    group: 'Contact & accounts',
    rules: [
      {
        key: 'contact_notification',
        label: 'Contact form alert',
        description: 'Internal alert when a new contact message arrives.',
      },
      {
        key: 'contact_reply',
        label: 'Contact reply',
        description: 'Reply email sent from the admin Messages page.',
      },
      {
        key: 'password_reset',
        label: 'Password reset',
        description: 'Sent when a customer requests a new password.',
      },
    ],
  },
];

const ALL_KEYS = RULE_GROUPS.flatMap((g) => g.rules.map((r) => r.key));

const defaultState = () =>
  ALL_KEYS.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});

export default function ConditionalEmails() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>(defaultState);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (data?.setting_value && typeof data.setting_value === 'object') {
        const stored = data.setting_value as Record<string, unknown>;
        setSettings((prev) => {
          const next = { ...prev };
          ALL_KEYS.forEach((key) => {
            if (typeof stored[key] === 'boolean') next[key] = stored[key] as boolean;
          });
          return next;
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          setting_key: SETTING_KEY,
          setting_value: settings,
          description: 'Toggles controlling which transactional emails are sent',
        },
        { onConflict: 'setting_key' }
      );
    setSaving(false);

    if (error) {
      toast({
        title: 'Could not save',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Email rules saved',
      description: 'Your conditional email settings have been updated.',
    });
  };

  const enabledCount = ALL_KEYS.filter((key) => settings[key]).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Conditional Emails
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which automated emails go out. {enabledCount} of {ALL_KEYS.length} enabled.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="grid gap-6">
            {RULE_GROUPS.map((group) => (
              <Card key={group.group}>
                <CardHeader>
                  <CardTitle className="text-lg">{group.group}</CardTitle>
                  <CardDescription>
                    Turn individual emails on or off for this area.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.rules.map((rule) => (
                    <div
                      key={rule.key}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <Label htmlFor={rule.key} className="text-base">
                          {rule.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <Switch
                        id={rule.key}
                        checked={settings[rule.key]}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, [rule.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
