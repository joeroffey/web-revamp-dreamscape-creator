
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings2, Clock, PoundSterling, Save, Mail, Send, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [bulkEmailLoading, setBulkEmailLoading] = useState(false);
  const [resendFailedLoading, setResendFailedLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // Pricing settings - only communal (combined) and private sessions
  // Prices are stored in pence in DB, but shown/edited in pounds in the UI.
  const [pricingConfig, setPricingConfig] = useState<Record<string, { price_amount: number }>>({
    combined: { price_amount: 1800 },  // £18 per person communal
    private: { price_amount: 7000 }    // £70 flat rate private
  });

  // Business hours
  const [businessHours, setBusinessHours] = useState({
    monday: { open: '09:00', close: '19:00', closed: false },
    tuesday: { open: '09:00', close: '19:00', closed: false },
    wednesday: { open: '09:00', close: '19:00', closed: false },
    thursday: { open: '09:00', close: '19:00', closed: false },
    friday: { open: '09:00', close: '19:00', closed: false },
    saturday: { open: '10:00', close: '18:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: true }
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    businessName: 'Wellness Hub',
    contactEmail: 'info@wellnesshub.com',
    contactPhone: '+44 123 456 7890',
    address: '123 Wellness Street, Health City, HC1 2AB',
    bookingNotifications: true,
    autoConfirmBookings: false,
    maxAdvanceBookingDays: 30
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch pricing config
      const { data: pricing } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true);

      if (pricing) {
        const pricingMap: Record<string, { price_amount: number }> = {};
        pricing.forEach(item => {
          // Only load combined and private pricing
          if (item.service_type === 'combined' || item.service_type === 'private') {
            pricingMap[item.service_type] = {
              price_amount: item.price_amount
            };
          }
        });
        setPricingConfig(prev => ({ ...prev, ...pricingMap }));
      }

      // Fetch system settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*');

      if (settings) {
        const settingsMap: any = {};
        settings.forEach(setting => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
        
        if (settingsMap.business_hours) {
          // Normalize business hours to ensure all days have complete structure
          const loadedHours = settingsMap.business_hours;
          
          const defaultHours = {
            monday: { open: '09:00', close: '19:00', closed: false },
            tuesday: { open: '09:00', close: '19:00', closed: false },
            wednesday: { open: '09:00', close: '19:00', closed: false },
            thursday: { open: '09:00', close: '19:00', closed: false },
            friday: { open: '09:00', close: '19:00', closed: false },
            saturday: { open: '10:00', close: '18:00', closed: false },
            sunday: { open: '10:00', close: '18:00', closed: true }
          };
          
          const normalizedHours = {
            monday: {
              open: loadedHours.monday?.open || defaultHours.monday.open,
              close: loadedHours.monday?.close || defaultHours.monday.close,
              closed: loadedHours.monday?.closed ?? defaultHours.monday.closed
            },
            tuesday: {
              open: loadedHours.tuesday?.open || defaultHours.tuesday.open,
              close: loadedHours.tuesday?.close || defaultHours.tuesday.close,
              closed: loadedHours.tuesday?.closed ?? defaultHours.tuesday.closed
            },
            wednesday: {
              open: loadedHours.wednesday?.open || defaultHours.wednesday.open,
              close: loadedHours.wednesday?.close || defaultHours.wednesday.close,
              closed: loadedHours.wednesday?.closed ?? defaultHours.wednesday.closed
            },
            thursday: {
              open: loadedHours.thursday?.open || defaultHours.thursday.open,
              close: loadedHours.thursday?.close || defaultHours.thursday.close,
              closed: loadedHours.thursday?.closed ?? defaultHours.thursday.closed
            },
            friday: {
              open: loadedHours.friday?.open || defaultHours.friday.open,
              close: loadedHours.friday?.close || defaultHours.friday.close,
              closed: loadedHours.friday?.closed ?? defaultHours.friday.closed
            },
            saturday: {
              open: loadedHours.saturday?.open || defaultHours.saturday.open,
              close: loadedHours.saturday?.close || defaultHours.saturday.close,
              closed: loadedHours.saturday?.closed ?? defaultHours.saturday.closed
            },
            sunday: {
              open: loadedHours.sunday?.open || defaultHours.sunday.open,
              close: loadedHours.sunday?.close || defaultHours.sunday.close,
              closed: loadedHours.sunday?.closed ?? defaultHours.sunday.closed
            }
          };
          
          setBusinessHours(normalizedHours);
        }
        if (settingsMap.business_info) {
          setSystemSettings(prev => ({ ...prev, ...settingsMap.business_info }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaveLoading(true);
    try {
      // Update pricing config - only combined and private
      for (const [serviceType, config] of Object.entries(pricingConfig)) {
        await supabase
          .from('pricing_config')
          .upsert({
            service_type: serviceType,
            price_amount: config.price_amount,
            duration_minutes: 60, // All sessions are 60 minutes
            is_active: true
          }, { onConflict: 'service_type' });
      }

      // Update business hours - ensure all days have complete structure
      const normalizedBusinessHours: Record<string, { open: string; close: string; closed: boolean }> = {};
      for (const [day, hours] of Object.entries(businessHours)) {
        normalizedBusinessHours[day] = {
          open: hours.open || '09:00',
          close: hours.close || '19:00',
          closed: hours.closed ?? false
        };
      }
      
      const { error: businessHoursError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'business_hours',
          setting_value: normalizedBusinessHours,
          description: 'Business operating hours',
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      
      if (businessHoursError) {
        console.error('Error saving business hours:', businessHoursError);
        throw businessHoursError;
      }

      const { error: businessInfoError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'business_info',
          setting_value: systemSettings,
          description: 'Business contact information and settings',
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      
      if (businessInfoError) {
        console.error('Error saving business info:', businessInfoError);
        throw businessInfoError;
      }

      toast({
        title: "Settings Saved",
        description: "All settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <Button onClick={saveSettings} disabled={saveLoading} className="min-h-[44px]">
            <Save className="h-4 w-4 mr-2" />
            {saveLoading ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Pricing Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communal Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label className="font-medium text-base">Communal Session</Label>
                  <p className="text-sm text-muted-foreground mt-1">Per person price for communal bookings</p>
                </div>
                <div>
                  <Label htmlFor="combined-price">Price per Person (£)</Label>
                  <Input
                    id="combined-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={Number((pricingConfig.combined?.price_amount / 100).toFixed(2))}
                    onChange={(e) => {
                      const pounds = Number(e.target.value || 0);
                      const pence = Math.round(pounds * 100);
                      setPricingConfig(prev => ({
                        ...prev,
                        combined: { price_amount: pence }
                      }));
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Private Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label className="font-medium text-base">Private Session</Label>
                  <p className="text-sm text-muted-foreground mt-1">Flat rate for exclusive use</p>
                </div>
                <div>
                  <Label htmlFor="private-price">Flat Rate (£)</Label>
                  <Input
                    id="private-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={Number((pricingConfig.private?.price_amount / 100).toFixed(2))}
                    onChange={(e) => {
                      const pounds = Number(e.target.value || 0);
                      const pence = Math.round(pounds * 100);
                      setPricingConfig(prev => ({
                        ...prev,
                        private: { price_amount: pence }
                      }));
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <Label className="font-medium capitalize">{day}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => setBusinessHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], closed: !checked }
                      }))}
                    />
                    <span className="text-sm">{hours.closed ? 'Closed' : 'Open'}</span>
                  </div>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setBusinessHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], open: e.target.value }
                        }))}
                      />
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setBusinessHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], close: e.target.value }
                        }))}
                      />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={systemSettings.businessName}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, businessName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={systemSettings.contactEmail}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={systemSettings.contactPhone}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxBookingDays">Max Advance Booking (days)</Label>
                  <Input
                    id="maxBookingDays"
                    type="number"
                    value={systemSettings.maxAdvanceBookingDays}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxAdvanceBookingDays: parseInt(e.target.value) || 30 }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={systemSettings.address}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Booking Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new bookings</p>
                  </div>
                  <Switch
                    checked={systemSettings.bookingNotifications}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, bookingNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-confirm Bookings</Label>
                    <p className="text-sm text-muted-foreground">Automatically confirm bookings upon payment</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoConfirmBookings}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoConfirmBookings: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Password Reset Emails */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Customer Migration Emails
              </CardTitle>
              <CardDescription>
                Send password reset emails to all imported customers so they can set up their accounts on the new website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Email First */}
              <div className="p-4 border rounded-lg bg-background">
                <Label className="font-medium text-base">Step 1: Test Email</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Send a test email to yourself first to verify the template looks correct.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="your-email@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    disabled={testEmailLoading || !testEmail}
                    onClick={async () => {
                      setTestEmailLoading(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) throw new Error('Not authenticated');
                        
                        const response = await fetch(
                          `https://ismifvjzvvyleahdmdrz.supabase.co/functions/v1/send-bulk-password-reset`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({ testMode: true, testEmail }),
                          }
                        );
                        
                        const result = await response.json();
                        
                        if (!response.ok) {
                          throw new Error(result.error || 'Failed to send test email');
                        }
                        
                        if (result.sent === 1) {
                          toast({
                            title: "Test Email Sent!",
                            description: `Check ${testEmail} for the password reset email.`,
                          });
                        } else {
                          toast({
                            title: "Email Not Sent",
                            description: result.errors?.[0] || "The test email could not be sent. Make sure the email exists in the system.",
                            variant: "destructive",
                          });
                        }
                      } catch (error: any) {
                        console.error('Test email error:', error);
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      } finally {
                        setTestEmailLoading(false);
                      }
                    }}
                    className="min-h-[44px]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {testEmailLoading ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>

              {/* Resend to Failed Only */}
              <div className="p-4 border rounded-lg bg-background">
                <Label className="font-medium text-base">Step 2: Resend to Failed Recipients</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Only sends to customers who didn't receive the email (due to rate limiting or errors). Processes in batches of 100 to avoid timeouts.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={resendFailedLoading} className="min-h-[44px]">
                      <Send className="h-4 w-4 mr-2" />
                      {resendFailedLoading ? 'Sending...' : 'Resend to Failed Only'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resend to Failed Recipients?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will only send emails to customers who didn't receive the previous email.
                        Customers who already received the email successfully will be skipped.
                        Emails are sent in batches of 100 - you may need to click again if there are more.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setResendFailedLoading(true);
                          let totalSent = 0;
                          let totalFailed = 0;
                          let hasMore = true;
                          let batchCount = 0;
                          
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) throw new Error('Not authenticated');
                            
                            // Process batches until no more remain
                            while (hasMore) {
                              batchCount++;
                              console.log(`Processing batch ${batchCount}...`);
                              
                              const response = await fetch(
                                `https://ismifvjzvvyleahdmdrz.supabase.co/functions/v1/send-bulk-password-reset`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`,
                                  },
                                  body: JSON.stringify({ resendFailed: true }),
                                }
                              );
                              
                              const result = await response.json();
                              
                              if (!response.ok) {
                                throw new Error(result.error || 'Failed to send emails');
                              }
                              
                              totalSent += result.sent || 0;
                              totalFailed += result.failed || 0;
                              hasMore = result.hasMore || false;
                              
                              console.log(`Batch ${batchCount}: sent ${result.sent}, ${result.total - result.batchSize} remaining`);
                              
                              // Small delay between batches to avoid overwhelming
                              if (hasMore) {
                                await new Promise(r => setTimeout(r, 1000));
                              }
                            }
                            
                            toast({
                              title: "All Emails Sent!",
                              description: `Successfully sent ${totalSent} emails across ${batchCount} batch(es). ${totalFailed} failed.`,
                            });
                          } catch (error: any) {
                            console.error('Resend failed email error:', error);
                            toast({
                              title: "Error",
                              description: `${error.message}. Sent ${totalSent} emails before error.`,
                              variant: "destructive",
                            });
                          } finally {
                            setResendFailedLoading(false);
                          }
                        }}
                      >
                        Yes, Resend to Failed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Send to All */}
              <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <Label className="font-medium text-base">Step 3: Send to ALL Customers (Use with Caution)</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      This will send password reset emails to ALL registered users, including those who already received one. Only use this if you need to start fresh.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={bulkEmailLoading} className="min-h-[44px]">
                          <Mail className="h-4 w-4 mr-2" />
                          {bulkEmailLoading ? 'Sending Emails...' : 'Send to All Customers'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will send password reset emails to ALL customers in the system. 
                            This action cannot be undone and may send hundreds of emails.
                            <br /><br />
                            <strong>Recommended:</strong> Use "Resend to Failed Only" instead to avoid sending duplicate emails.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              setBulkEmailLoading(true);
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) throw new Error('Not authenticated');
                                
                                const response = await fetch(
                                  `https://ismifvjzvvyleahdmdrz.supabase.co/functions/v1/send-bulk-password-reset`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({}),
                                  }
                                );
                                
                                const result = await response.json();
                                
                                if (!response.ok) {
                                  throw new Error(result.error || 'Failed to send emails');
                                }
                                
                                toast({
                                  title: "Emails Sent!",
                                  description: `Successfully sent ${result.sent} emails. ${result.failed} failed, ${result.skipped} skipped.`,
                                });
                                
                                if (result.errors?.length > 0) {
                                  console.error('Email errors:', result.errors);
                                }
                              } catch (error: any) {
                                console.error('Bulk email error:', error);
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              } finally {
                                setBulkEmailLoading(false);
                              }
                            }}
                          >
                            Yes, Send All Emails
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
