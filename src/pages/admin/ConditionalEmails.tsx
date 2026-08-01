import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users, Clock, Phone, Info, TrendingUp, Settings, Check, X } from 'lucide-react';
import { format, addDays, isToday, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MailchimpTemplate {
  id: string;
  name: string;
}

interface ConditionalEmailRule {
  id: string;
  template_id: string;
  template_name: string;
  condition_type: string;
  condition_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConditionalEmails() {
  const [templates, setTemplates] = useState<MailchimpTemplate[]>([]);
  const [rules, setRules] = useState<ConditionalEmailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [ruleLoading, setRuleLoading] = useState(true);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [conditionType, setConditionType] = useState<string>('');
  const [conditionValue, setConditionValue] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState(false);

  const { toast } = useToast();

  // Fetch Mailchimp templates (assuming we have an endpoint)
  useEffect(() => {
    const fetchTemplates = async () => {
      setTemplateLoading(true);
      try {
        // In a real app, we would call our backend endpoint to get Mailchimp templates
        // For now, we'll simulate with some mock data
        // Replace this with actual API call: const { data } = await supabase.functions.get('mailchimp-templates');
        const mockTemplates: MailchimpTemplate[] = [
          { id: 'template_1', name: 'Welcome Email - First Booking' },
          { id: 'template_2', name: 'Loyalty Reward - 5 Bookings' },
          { id: 'template_3', name: 'Milestone Achievement - 10 Bookings' },
          { id: 'template_4', name: 'Membership Renewal Reminder' },
          { id: 'template_5', name: 'We Miss You - Come Back Soon' },
          { id: 'template_6', name: 'Token Balance Low' },
        ];
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Error fetching Mailchimp templates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch email templates. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setTemplateLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  // Fetch existing conditional email rules from Supabase
  useEffect(() => {
    const fetchRules = async () => {
      setRuleLoading(true);
      try {
        const { data, error } = await supabase
          .from('conditional_emails')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRules(data || []);
      } catch (error) {
        console.error('Error fetching conditional email rules:', error);
        toast({
          title: "Error",
          description: "Failed to fetch email rules. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setRuleLoading(false);
      }
    };

    fetchRules();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !conditionType || !conditionValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('conditional_emails')
        .insert({
          template_id: selectedTemplate,
          template_name: templates.find(t => t.id === selectedTemplate)?.name || '',
          condition_type,
          condition_value,
          is_active,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Rule Created",
        description: "Conditional email rule has been created successfully.",
      });

      // Reset form
      setSelectedTemplate('');
      setConditionType('');
      setConditionValue('');
      setIsActive(true);

      // Refresh rules
      const { data: updatedRules, error } = await supabase
        .from('conditional_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setRules(updatedRules || []);
    } catch (error) {
      console.error('Error creating conditional email rule:', error);
      toast({
        title: "Error",
        description: "Failed to create email rule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('conditional_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Rule Deleted",
        description: "Conditional email rule has been deleted successfully.",
      });

      // Refresh rules
      const { data: updatedRules, error } = await supabase
        .from('conditional_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setRules(updatedRules || []);
    } catch (error) {
      console.error('Error deleting conditional email rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete email rule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('conditional_emails')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Rule Updated",
        description: `Rule has been ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      // Refresh rules
      const { data: updatedRules, error } = await supabase
        .from('conditional_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setRules(updatedRules || []);
    } catch (error) {
      console.error('Error updating conditional email rule status:', error);
      toast({
        title: "Error",
        description: "Failed to update email rule. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format condition value for display based on condition type
  const formatConditionValue = (type: string, value: string): string => {
    switch (type) {
      case 'booking_count':
        return `${value} booking${value !== '1' ? 's' : ''}`;
      case 'membership_expiry':
        return `Expires in ${value} day${value !== '1' ? 's' : ''}`;
      case 'days_since_last_booking':
        return `Last booked ${value} day${value !== '1' ? 's' : ''} ago`;
      case 'token_balance':
        return `Token balance ≤ ${value}`;
      case 'customer_type':
        return `Customer type: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'birthday':
        return `Birthday in ${value} day${value !== '1' ? 's' : ''}`;
      default:
        return value;
    }
  };

  if (loading || templateLoading || ruleLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Conditional Email Settings"
            description="Setup automated emails based on customer behavior."
          />
          <div className="grid gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
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
        <AdminPageHeader
          title="Conditional Email Settings"
          description="Setup automated emails based on customer behavior."
        />

        {/* Add New Rule Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Conditional Email Rule</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Toggle form visibility? We'll keep it simple and always show for now
                }}
              >
                <Info className="h-4 w-4 mr-2" />
                Help
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateSelect">Email Template</Label>
                  <Select
                    id="templateSelect"
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conditionTypeSelect">Condition Type</Label>
                  <Select
                    id="conditionTypeSelect"
                    value={conditionType}
                    onValueChange={setConditionType}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking_count">Booking Count</SelectItem>
                      <SelectItem value="membership_expiry">Membership Expiry</SelectItem>
                      <SelectItem value="days_since_last_booking">Days Since Last Booking</SelectItem>
                      <SelectItem value="token_balance">Token Balance</SelectItem>
                      <SelectItem value="customer_type">Customer Type</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionValueInput">Condition Value</Label>
                <div className="flex items-center gap-3">
                  {conditionType === 'booking_count' ||
                   conditionType === 'membership_expiry' ||
                   conditionType === 'days_since_last_booking' ||
                   conditionType === 'token_balance' ||
                   conditionType === 'birthday' ? (
                    <>
                      <Input
                        id="conditionValueInput"
                        type="number"
                        min="1"
                        value={conditionValue}
                        onChange={(e) => setConditionValue(e.target.value)}
                        disabled={formLoading}
                      />
                      <span className="text-xs text-muted-foreground">
                        Enter a number (e.g., 1, 5, 10)
                      </span>
                    </>
                  ) : conditionType === 'customer_type' ? (
                    <>
                      <Select
                        id="conditionValueInput"
                        value={conditionValue}
                        onValueChange={setConditionValue}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Customer</SelectItem>
                          <SelectItem value="regular">Regular Customer</SelectItem>
                          <SelectItem value="vip">VIP Customer</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Input
                      id="conditionValueInput"
                      type="text"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      disabled={formLoading}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="activeSwitch" className="text-base font-medium cursor-pointer">
                  Active Rule
                </Label>
                <Switch
                  id="activeSwitch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={formLoading}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate('');
                    setConditionType('');
                    setConditionValue('');
                    setIsActive(true);
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {formLoading ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Existing Rules List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Existing Rules ({rules.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Could add a button to refresh or something
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No conditional email rules configured yet.</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Use the form above to create your first rule.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{rule.template_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatConditionValue(rule.condition_type, rule.condition_value)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(rule.created_at), 'PPp')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div>Template ID: {rule.template_id}</div>
                        <div>Condition: {rule.condition_type}</div>
                        <div>Value: {rule.condition_value}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                        disabled={ruleLoading}
                      >
                        {rule.is_active ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>

                      <Button
                        variant="destructive"
                        ghost
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={ruleLoading}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}