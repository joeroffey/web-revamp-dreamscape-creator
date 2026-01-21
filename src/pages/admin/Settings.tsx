
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings2, Clock, PoundSterling, Save } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
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
          setBusinessHours(settingsMap.business_hours);
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

      // Update business hours
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'business_hours',
          setting_value: businessHours,
          description: 'Business operating hours'
        });

      // Update business info
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'business_info',
          setting_value: systemSettings,
          description: 'Business contact information and settings'
        });

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
        </div>
      </div>
    </AdminLayout>
  );
}
