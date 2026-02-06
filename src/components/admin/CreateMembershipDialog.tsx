import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCustomerSearch, CustomerSearchResult } from '@/hooks/useCustomerSearch';
import { Loader2, CreditCard, Check, ChevronsUpDown, User, AlertCircle, Banknote, Building2, Search } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembershipCreated: () => void;
}

type PaymentMode = 'manual' | 'card' | 'bacs_debit';

export function CreateMembershipDialog({ open, onOpenChange, onMembershipCreated }: CreateMembershipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('manual');
  const [form, setForm] = useState({
    membershipType: '4_sessions_month',
    durationMonths: '1',
  });

  // Use the shared customer search hook
  const { customers: filteredCustomers, isLoading: loadingCustomers } = useCustomerSearch(
    customerSearchTerm,
    { enabled: open, limit: 50 }
  );

  const membershipOptions = [
    { value: '4_sessions_month', label: '4 Sessions Per Month', sessions: 4, price: 48 },
    { value: '8_sessions_month', label: '8 Sessions Per Month', sessions: 8, price: 75 },
    { value: 'unlimited', label: 'Unlimited', sessions: 999, price: 100 },
  ];

  const durationOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' },
  ];

  useEffect(() => {
    if (selectedCustomer) {
      checkCustomerAccount(selectedCustomer.email);
    } else {
      setHasAccount(null);
      setUserId(null);
    }
  }, [selectedCustomer]);

  const checkCustomerAccount = async (email: string) => {
    try {
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

    setLoading(true);

    try {
      if (paymentMode === 'card' || paymentMode === 'bacs_debit') {
        const { data, error } = await supabase.functions.invoke('create-admin-membership-payment', {
          body: {
            customerEmail: selectedCustomer.email,
            customerName: selectedCustomer.full_name,
            membershipType: form.membershipType,
            durationMonths: parseInt(form.durationMonths),
            paymentMethod: paymentMode,
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error('Failed to create payment session');
      }

      const selectedMembership = membershipOptions.find(m => m.value === form.membershipType);
      const sessionsPerMonth = selectedMembership?.sessions || 4;
      const durationMonths = parseInt(form.durationMonths);
      
      const startDate = new Date();
      const endDate = addMonths(startDate, durationMonths);

      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('customer_email', selectedCustomer.email.toLowerCase())
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

      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: userId || null,
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

      resetForm();
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

  const resetForm = () => {
    setSelectedCustomer(null);
    setHasAccount(null);
    setUserId(null);
    setPaymentMode('manual');
    setForm({
      membershipType: '4_sessions_month',
      durationMonths: '1',
    });
  };

  const selectedMembership = membershipOptions.find(m => m.value === form.membershipType);
  const durationMonths = parseInt(form.durationMonths);
  const endDate = addMonths(new Date(), durationMonths);

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Create Membership
          </DialogTitle>
          <DialogDescription>
            Create a membership and optionally set up recurring payments.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
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
                  <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-3 py-2">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Search by name or email..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    
                    {/* Customer List */}
                    <ScrollArea className="max-h-[250px]">
                      {loadingCustomers ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading customers...</span>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No customers found.
                        </div>
                      ) : (
                        <div className="p-1">
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {filteredCustomers.length} customers
                          </div>
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearchOpen(false);
                                setCustomerSearchTerm('');
                              }}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedCustomer?.id === customer.id && "bg-accent"
                              )}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col text-left">
                                <span>{customer.full_name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">{customer.email}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>

              {selectedCustomer && hasAccount === false && (
                <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded-md text-sm text-warning-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No account yet. Membership will be linked when they sign up.</span>
                </div>
              )}
              {selectedCustomer && hasAccount === true && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-md text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span>Customer has an account ✓</span>
                </div>
              )}
            </div>

            {/* Membership Type */}
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
                      {option.label} - £{option.price}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Payment Setup</Label>
              <RadioGroup 
                value={paymentMode} 
                onValueChange={(value) => setPaymentMode(value as PaymentMode)}
                className="grid grid-cols-1 gap-2"
              >
                <div className={cn(
                  "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors",
                  paymentMode === 'manual' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Manual / Cash</p>
                      <p className="text-xs text-muted-foreground">Already paid, no payment setup needed</p>
                    </div>
                  </Label>
                </div>
                
                <div className={cn(
                  "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors",
                  paymentMode === 'card' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Card Payment</p>
                      <p className="text-xs text-muted-foreground">Set up recurring card payments</p>
                    </div>
                  </Label>
                </div>
                
                <div className={cn(
                  "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors",
                  paymentMode === 'bacs_debit' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="bacs_debit" id="bacs_debit" />
                  <Label htmlFor="bacs_debit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Direct Debit (BACS)</p>
                      <p className="text-xs text-muted-foreground">Set up recurring bank payments</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Duration - only show for manual */}
            {paymentMode === 'manual' && (
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
            )}

            {/* Summary */}
            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p><strong>Summary:</strong></p>
              {selectedCustomer && <p>• Customer: {selectedCustomer.full_name}</p>}
              <p>• {selectedMembership?.label} - £{selectedMembership?.price}/month</p>
              {paymentMode === 'manual' && (
                <>
                  <p>• Duration: {durationMonths} month{durationMonths > 1 ? 's' : ''}</p>
                  <p>• Ends: {format(endDate, 'dd MMM yyyy')}</p>
                </>
              )}
              {paymentMode !== 'manual' && (
                <p className="text-muted-foreground text-xs mt-2">
                  Customer will be redirected to Stripe to enter payment details
                </p>
              )}
              {paymentMode === 'manual' && (
                <p className="text-muted-foreground text-xs mt-2">
                  * Manual memberships don't auto-renew
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedCustomer}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {paymentMode === 'manual' ? 'Creating...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  {paymentMode === 'manual' ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Membership
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Setup Payment
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
