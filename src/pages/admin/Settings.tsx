import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, DollarSign, Clock, Settings as SettingsIcon } from 'lucide-react';

interface PricingConfig {
  id: string;
  service_type: string;
  price_amount: number;
  duration_minutes: number;
  description: string;
  is_active: boolean;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export default function AdminSettings() {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch pricing configuration
      const { data: pricing, error: pricingError } = await supabase
        .from('pricing_config')
        .select('*')
        .order('service_type');

      if (pricingError) throw pricingError;

      // Fetch system settings
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (settingsError) throw settingsError;

      setPricingConfig(pricing || []);
      setSystemSettings(settings || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = async (id: string, updates: Partial<PricingConfig>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pricing_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPricingConfig(prev =>
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      toast.success('Pricing updated successfully');
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const updateSystemSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;

      setSystemSettings(prev =>
        prev.map(setting =>
          setting.setting_key === key
            ? { ...setting, setting_value: value }
            : setting
        )
      );
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <SettingsIcon className="h-4 w-4" />
            <span className="text-sm">Manage your business configuration</span>
          </div>
        </div>

        {/* Pricing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Pricing Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pricingConfig.map((pricing) => (
              <div key={pricing.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize">{pricing.service_type.replace('_', ' ')} Session</h3>
                  <Switch
                    checked={pricing.is_active}
                    onCheckedChange={(checked) => updatePricing(pricing.id, { is_active: checked })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`price-${pricing.id}`}>Price (£)</Label>
                    <Input
                      id={`price-${pricing.id}`}
                      type="number"
                      step="0.01"
                      value={pricing.price_amount / 100}
                      onChange={(e) => {
                        const newAmount = Math.round(parseFloat(e.target.value) * 100);
                        updatePricing(pricing.id, { price_amount: newAmount });
                      }}
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`duration-${pricing.id}`}>Duration (minutes)</Label>
                    <Input
                      id={`duration-${pricing.id}`}
                      type="number"
                      value={pricing.duration_minutes}
                      onChange={(e) => {
                        updatePricing(pricing.id, { duration_minutes: parseInt(e.target.value) });
                      }}
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Current Price Display</Label>
                    <div className="text-lg font-medium text-primary">
                      {formatCurrency(pricing.price_amount)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`description-${pricing.id}`}>Description</Label>
                  <Textarea
                    id={`description-${pricing.id}`}
                    value={pricing.description || ''}
                    onChange={(e) => {
                      updatePricing(pricing.id, { description: e.target.value });
                    }}
                    disabled={saving}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Business Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemSettings
              .filter(setting => setting.setting_key === 'business_hours')
              .map((setting) => {
                const hours = setting.setting_value as any;
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                
                return (
                  <div key={setting.id} className="space-y-4">
                    {days.map((day) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24 capitalize font-medium">{day}</div>
                        {hours[day]?.closed ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">Closed</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newHours = {
                                  ...hours,
                                  [day]: { open: '09:00', close: '17:00' }
                                };
                                updateSystemSetting('business_hours', newHours);
                              }}
                            >
                              Open
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={hours[day]?.open || '09:00'}
                              onChange={(e) => {
                                const newHours = {
                                  ...hours,
                                  [day]: { ...hours[day], open: e.target.value }
                                };
                                updateSystemSetting('business_hours', newHours);
                              }}
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={hours[day]?.close || '17:00'}
                              onChange={(e) => {
                                const newHours = {
                                  ...hours,
                                  [day]: { ...hours[day], close: e.target.value }
                                };
                                updateSystemSetting('business_hours', newHours);
                              }}
                              className="w-32"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newHours = {
                                  ...hours,
                                  [day]: { closed: true }
                                };
                                updateSystemSetting('business_hours', newHours);
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Other System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemSettings
              .filter(setting => setting.setting_key !== 'business_hours')
              .map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.setting_key} className="capitalize">
                    {setting.setting_key.replace('_', ' ')}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={setting.setting_key}
                      type="number"
                      value={setting.setting_value}
                      onChange={(e) => {
                        updateSystemSetting(setting.setting_key, parseInt(e.target.value));
                      }}
                      disabled={saving}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {setting.description}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
