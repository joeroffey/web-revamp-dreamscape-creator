import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Mail, MailOpen, Reply, Send, Eye, Phone, Clock } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const ModernMessageManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', id)
        .eq('status', 'new');
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-messages'] }),
  });

  const handleViewMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText('');
    setIsReplying(false);
    if (msg.status === 'new') {
      markAsRead.mutate(msg.id);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const response = await supabase.functions.invoke('send-contact-reply', {
        body: { messageId: selectedMessage.id, replyText: replyText.trim() },
      });
      if (response.error) throw response.error;
      toast({ title: 'Reply sent successfully!' });
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    } catch (error: any) {
      toast({ title: 'Failed to send reply', description: error.message, variant: 'destructive' });
    } finally {
      setIsReplying(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500 text-white">New</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-600 text-white">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Messages"
          description={`${messages.length} total messages${newCount > 0 ? ` · ${newCount} new` : ''}`}
        />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-all hover:shadow-md ${msg.status === 'new' ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                onClick={() => handleViewMessage(msg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {msg.status === 'new' ? (
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : msg.status === 'replied' ? (
                        <Reply className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <MailOpen className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${msg.status === 'new' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {msg.name}
                          </span>
                          {statusBadge(msg.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{msg.email}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.created_at), 'dd MMM yyyy HH:mm')}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Message from {selectedMessage?.name}</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedMessage.email}</span>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedMessage.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(selectedMessage.created_at), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Message:</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {selectedMessage.admin_reply && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2 text-green-700 dark:text-green-400">Your Reply:</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                    {selectedMessage.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Replied {format(new Date(selectedMessage.replied_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                )}

                {selectedMessage.status !== 'replied' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={5}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isReplying}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ModernMessageManagement;
