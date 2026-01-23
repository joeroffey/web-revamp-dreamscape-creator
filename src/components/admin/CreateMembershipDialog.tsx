import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import { addMonths, format } from 'date-fns';

interface CreateMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembershipCreated: () => void;
}

export function CreateMembershipDialog({ open, onOpenChange, onMembershipCreated }: CreateMembershipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    membershipType: '4_sessions_month',
    durationMonths: '1',
  });

  const membershipOptions = [
    { value: '4_sessions_month', label: '4 Sessions Per Month', sessions: 4 },
    { value: '8_sessions_month', label: '8 Sessions Per Month', sessions: 8 },
    { value: 'unlimited', label: 'Unlimited', sessions: 999 },
  ];

  const durationOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide customer name and email",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.customerEmail.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedMembership = membershipOptions.find(m => m.value === form.membershipType);
      const sessionsPerMonth = selectedMembership?.sessions || 4;
      const durationMonths = parseInt(form.durationMonths);
      
      const startDate = new Date();
      const endDate = addMonths(startDate, durationMonths);

      // Check if customer already has an active membership
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('customer_email', form.customerEmail.trim().toLowerCase())
        .eq('status', 'active')
        .single();

      if (existingMembership) {
        toast({
          title: "Active Membership Exists",
          description: "This customer already has an active membership. Cancel it first to create a new one.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create the membership (user_id is null for manual/cash memberships)
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: null, // Manual memberships don't require a linked account
          customer_name: form.customerName.trim(),
          customer_email: form.customerEmail.trim().toLowerCase(),
          membership_type: form.membershipType,
          sessions_per_week: sessionsPerMonth, // Using sessions_per_week field for monthly sessions
          sessions_remaining: sessionsPerMonth,
          discount_percentage: 0,
          status: 'active',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          is_auto_renew: false, // Manual memberships don't auto-renew
          stripe_subscription_id: null, // No Stripe for cash payments
        });

      if (error) throw error;

      toast({
        title: "Membership Created",
        description: `Successfully created ${selectedMembership?.label} membership for ${form.customerName}`,
      });

      // Reset form and close
      setForm({
        customerName: '',
        customerEmail: '',
        membershipType: '4_sessions_month',
        durationMonths: '1',
      });
      onOpenChange(false);
      onMembershipCreated();
    } catch (error: any) {
      console.error('Error creating membership:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create membership",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMembership = membershipOptions.find(m => m.value === form.membershipType);
  const durationMonths = parseInt(form.durationMonths);
  const endDate = addMonths(new Date(), durationMonths);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Create Manual Membership
          </DialogTitle>
          <DialogDescription>
            Create a membership for a customer who paid in cash or by other methods.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={form.customerName}
              onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Customer Email *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={form.membershipType}
              onValueChange={(value) => setForm(prev => ({ ...prev, membershipType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                {membershipOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={form.durationMonths}
              onValueChange={(value) => setForm(prev => ({ ...prev, durationMonths: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p><strong>Summary:</strong></p>
            <p>• {selectedMembership?.label}</p>
            <p>• Duration: {durationMonths} month{durationMonths > 1 ? 's' : ''}</p>
            <p>• Ends: {format(endDate, 'dd MMM yyyy')}</p>
            <p className="text-muted-foreground text-xs mt-2">
              * Manual memberships don't auto-renew
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Membership
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
