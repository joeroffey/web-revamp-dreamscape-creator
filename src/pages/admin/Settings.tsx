
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
import { Settings2, Clock, DollarSign, Save } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Pricing settings
  const [pricingConfig, setPricingConfig] = useState({
    iceBath: { price: 3000, duration: 60 },
    sauna: { price: 2500, duration: 60 },
    combined: { price: 4500, duration: 90 }
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
        const pricingMap: any = {};
        pricing.forEach(item => {
          pricingMap[item.service_type] = {
            price: item.price_amount,
            duration: item.duration_minutes
          };
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
      // Update pricing config
      for (const [serviceType, config] of Object.entries(pricingConfig)) {
        await supabase
          .from('pricing_config')
          .upsert({
            service_type: serviceType,
            price_amount: config.price,
            duration_minutes: config.duration,
            is_active: true
          });
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
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(pricingConfig).map(([serviceType, config]) => (
                <div key={serviceType} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium capitalize">
                      {serviceType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor={`${serviceType}-price`}>Price (pence)</Label>
                    <Input
                      id={`${serviceType}-price`}
                      type="number"
                      value={config.price}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        [serviceType]: { ...prev[serviceType], price: parseInt(e.target.value) || 0 }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${serviceType}-duration`}>Duration (minutes)</Label>
                    <Input
                      id={`${serviceType}-duration`}
                      type="number"
                      value={config.duration}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        [serviceType]: { ...prev[serviceType], duration: parseInt(e.target.value) || 0 }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
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
