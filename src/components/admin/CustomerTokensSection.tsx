import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Plus, Trash2 } from 'lucide-react';
import { AddTokensDialog } from './AddTokensDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CustomerTokensSectionProps {
  customerEmail: string;
  customerName: string;
}

interface TokenRecord {
  id: string;
  customer_email: string;
  tokens_remaining: number;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

export function CustomerTokensSection({ customerEmail, customerName }: CustomerTokensSectionProps) {
  const [showAddTokens, setShowAddTokens] = useState(false);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['customer-tokens', customerEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_tokens')
        .select('*')
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TokenRecord[];
    },
  });

  const handleDeleteToken = async () => {
    if (!deleteTokenId) return;

    try {
      const { error } = await supabase
        .from('customer_tokens')
        .delete()
        .eq('id', deleteTokenId);

      if (error) throw error;

      toast({
        title: "Token record deleted",
        description: "The token record has been removed",
      });

      queryClient.invalidateQueries({ queryKey: ['customer-tokens', customerEmail] });
    } catch (error) {
      console.error('Error deleting token:', error);
      toast({
        title: "Error",
        description: "Failed to delete token record",
        variant: "destructive",
      });
    } finally {
      setDeleteTokenId(null);
    }
  };

  const getTokenStatus = (token: TokenRecord) => {
    if (token.tokens_remaining <= 0) {
      return { label: 'Depleted', variant: 'secondary' as const };
    }
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    if (!token.expires_at) {
      return { label: 'Never Expires', variant: 'default' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  const totalValidTokens = tokens?.reduce((sum, token) => {
    const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
    if (!isExpired && token.tokens_remaining > 0) {
      return sum + token.tokens_remaining;
    }
    return sum;
  }, 0) || 0;

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5" />
            Session Tokens
            {totalValidTokens > 0 && (
              <Badge variant="default" className="ml-2">
                {totalValidTokens} available
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddTokens(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Tokens
          </Button>
        </CardHeader>
        <CardContent>
          {tokens && tokens.length > 0 ? (
            <div className="space-y-3">
              {tokens.map((token) => {
                const status = getTokenStatus(token);
                return (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {token.tokens_remaining} token(s)
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {token.expires_at
                          ? `Expires: ${format(new Date(token.expires_at), 'MMM d, yyyy')}`
                          : 'Never expires'}
                      </div>
                      {token.notes && (
                        <div className="text-sm text-muted-foreground italic">
                          {token.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTokenId(token.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tokens assigned</p>
              <p className="text-sm">Add tokens for cash payments or promotions</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddTokensDialog
        open={showAddTokens}
        onOpenChange={setShowAddTokens}
        customerEmail={customerEmail}
        customerName={customerName}
        onTokensAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['customer-tokens', customerEmail] });
        }}
      />

      <AlertDialog open={!!deleteTokenId} onOpenChange={() => setDeleteTokenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Token Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this token record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteToken} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
