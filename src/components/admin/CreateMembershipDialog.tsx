import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, CreditCard, Check, ChevronsUpDown, User } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembershipCreated: () => void;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

export function CreateMembershipDialog({ open, onOpenChange, onMembershipCreated }: CreateMembershipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
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

  // Fetch users with accounts when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-users-with-accounts');

      if (error) throw error;

      if (data?.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "Select Customer",
        description: "Please select a customer to add the membership to",
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
        .eq('user_id', selectedUser.id)
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

      // Create the membership with the user's ID
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: selectedUser.id,
          customer_name: selectedUser.full_name || 'Unknown',
          customer_email: selectedUser.email.toLowerCase(),
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
        description: `Successfully created ${selectedMembership?.label} membership for ${selectedUser.full_name}`,
      });

      // Reset form and close
      setSelectedUser(null);
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
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-full justify-between h-auto min-h-[40px]"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2 text-left">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">{selectedUser.full_name}</span>
                        <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
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
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Loading customers...</span>
                        </div>
                      ) : (
                        "No customers found."
                      )}
                    </CommandEmpty>
                    <CommandGroup heading={`${users.length} customers with accounts`}>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.full_name} ${user.email}`}
                          onSelect={() => {
                            setSelectedUser(user);
                            setUserSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{user.full_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            {selectedUser && <p>• Customer: {selectedUser.full_name}</p>}
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
            <Button type="submit" disabled={loading || !selectedUser}>
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
