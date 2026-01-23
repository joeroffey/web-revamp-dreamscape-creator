import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerEmail: string;
  customerName: string;
  onTokensAdded: () => void;
}

export function AddTokensDialog({
  open,
  onOpenChange,
  customerEmail,
  customerName,
  onTokensAdded,
}: AddTokensDialogProps) {
  const [tokenCount, setTokenCount] = useState(1);
  const [neverExpires, setNeverExpires] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(addMonths(new Date(), 3));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (tokenCount < 1) {
      toast({
        title: "Invalid token count",
        description: "Please enter at least 1 token",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('customer_tokens')
        .insert({
          customer_email: customerEmail,
          tokens_remaining: tokenCount,
          expires_at: neverExpires ? null : expiryDate?.toISOString(),
          notes: notes || `Added ${tokenCount} token(s) by admin`,
        });

      if (error) throw error;

      toast({
        title: "Tokens added",
        description: `Added ${tokenCount} token(s) to ${customerName}`,
      });

      onTokensAdded();
      onOpenChange(false);
      
      // Reset form
      setTokenCount(1);
      setNeverExpires(false);
      setExpiryDate(addMonths(new Date(), 3));
      setNotes('');
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast({
        title: "Error",
        description: "Failed to add tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Add Tokens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Adding tokens to:</p>
            <p className="font-medium">{customerName}</p>
            <p className="text-sm text-muted-foreground">{customerEmail}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenCount">Number of Tokens</Label>
            <Input
              id="tokenCount"
              type="number"
              min="1"
              value={tokenCount}
              onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="neverExpires">Never Expires</Label>
            <Switch
              id="neverExpires"
              checked={neverExpires}
              onCheckedChange={setNeverExpires}
            />
          </div>

          {!neverExpires && (
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Cash payment received"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Adding...' : `Add ${tokenCount} Token(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
