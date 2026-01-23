import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, CreditCard, Check, ChevronsUpDown, User, AlertCircle } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembershipCreated: () => void;
}

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

export function CreateMembershipDialog({ open, onOpenChange, onMembershipCreated }: CreateMembershipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
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

  // Fetch customers from CRM when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  // Check if selected customer has an account
  useEffect(() => {
    if (selectedCustomer) {
      checkCustomerAccount(selectedCustomer.email);
    } else {
      setHasAccount(null);
      setUserId(null);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const checkCustomerAccount = async (email: string) => {
    try {
      // Call edge function to check if email has an account
      const { data, error } = await supabase.functions.invoke('get-users-with-accounts');
      
      if (error) throw error;

      const user = data?.users?.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        setHasAccount(true);
        setUserId(user.id);
      } else {
        setHasAccount(false);
        setUserId(null);
      }
    } catch (error) {
      console.error('Error checking account:', error);
      setHasAccount(false);
      setUserId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Select Customer",
        description: "Please select a customer to add the membership to",
        variant: "destructive",
      });
      return;
    }

    if (!hasAccount || !userId) {
      toast({
        title: "Account Required",
        description: "This customer needs to create an account before they can have a membership",
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
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingMembership) {
        toast({
          title: "Active Membership Exists",
          description: "This customer already has an active membership. Cancel it first to create a new one.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create the membership
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          customer_name: selectedCustomer.full_name || 'Unknown',
          customer_email: selectedCustomer.email.toLowerCase(),
          membership_type: form.membershipType,
          sessions_per_week: sessionsPerMonth,
          sessions_remaining: sessionsPerMonth,
          discount_percentage: 0,
          status: 'active',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          is_auto_renew: false,
          stripe_subscription_id: null,
        });

      if (error) throw error;

      toast({
        title: "Membership Created",
        description: `Successfully created ${selectedMembership?.label} membership for ${selectedCustomer.full_name}`,
      });

      // Reset form and close
      setSelectedCustomer(null);
      setHasAccount(null);
      setUserId(null);
      setForm({
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
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className="w-full justify-between h-auto min-h-[40px]"
                >
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2 text-left">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">{selectedCustomer.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{selectedCustomer.email}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select customer...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name or email..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingCustomers ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Loading customers...</span>
                        </div>
                      ) : (
                        "No customers found."
                      )}
                    </CommandEmpty>
                    <CommandGroup heading={`${customers.length} customers`}>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.full_name} ${customer.email}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{customer.full_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Account status indicator */}
            {selectedCustomer && hasAccount === false && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>This customer doesn't have an account. They need to sign up first.</span>
              </div>
            )}
            {selectedCustomer && hasAccount === true && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-700">
                <Check className="h-4 w-4" />
                <span>Customer has an account ✓</span>
              </div>
            )}
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
            {selectedCustomer && <p>• Customer: {selectedCustomer.full_name}</p>}
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
            <Button type="submit" disabled={loading || !selectedCustomer || !hasAccount}>
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
