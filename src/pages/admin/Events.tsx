import { useState, useEffect } from 'react';
import { AdminNavigation } from '@/components/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Calendar, Clock, GripVertical, Image, Loader2, Eye, EyeOff } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  instructor: string | null;
  short_description: string | null;
  full_description: string | null;
  image_url: string | null;
  secondary_image_url: string | null;
  event_dates: string[] | null;
  event_time: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

const AdminEvents = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'primary' | 'secondary' | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    instructor: '',
    short_description: '',
    full_description: '',
    image_url: '',
    secondary_image_url: '',
    event_dates: '',
    event_time: '',
    is_published: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setForm({
      title: '',
      subtitle: '',
      instructor: '',
      short_description: '',
      full_description: '',
      image_url: '',
      secondary_image_url: '',
      event_dates: '',
      event_time: '',
      is_published: true,
      display_order: events.length,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      subtitle: event.subtitle || '',
      instructor: event.instructor || '',
      short_description: event.short_description || '',
      full_description: event.full_description || '',
      image_url: event.image_url || '',
      secondary_image_url: event.secondary_image_url || '',
      event_dates: event.event_dates?.join(', ') || '',
      event_time: event.event_time || '',
      is_published: event.is_published,
      display_order: event.display_order,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File, imageType: 'primary' | 'secondary') => {
    setUploadingImage(imageType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      if (imageType === 'primary') {
        setForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setForm(prev => ({ ...prev, secondary_image_url: publicUrl }));
      }

      toast({
        title: "Image Uploaded",
        description: "Image has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        instructor: form.instructor.trim() || null,
        short_description: form.short_description.trim() || null,
        full_description: form.full_description.trim() || null,
        image_url: form.image_url.trim() || null,
        secondary_image_url: form.secondary_image_url.trim() || null,
        event_dates: form.event_dates ? form.event_dates.split(',').map(d => d.trim()).filter(Boolean) : null,
        event_time: form.event_time.trim() || null,
        is_published: form.is_published,
        display_order: form.display_order,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({ title: "Event Updated", description: "Event has been updated successfully" });
      } else {
        const { error } = await supabase
          .from('events')
          .insert(eventData);

        if (error) throw error;
        toast({ title: "Event Created", description: "Event has been created successfully" });
      }

      setDialogOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Event Deleted", description: "Event has been deleted successfully" });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !event.is_published })
        .eq('id', event.id);

      if (error) throw error;
      fetchEvents();
      toast({
        title: event.is_published ? "Event Unpublished" : "Event Published",
        description: `"${event.title}" is now ${event.is_published ? 'hidden' : 'visible'} on the website`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-wide">Events Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage events shown on the Events page</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to display on the website</p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:bg-muted/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image Preview */}
                    <div className="w-full md:w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        <Badge variant={event.is_published ? "default" : "secondary"}>
                          {event.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      {event.instructor && (
                        <p className="text-sm text-muted-foreground mb-1">With {event.instructor}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {event.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.event_time}
                          </span>
                        )}
                        {event.event_dates && event.event_dates.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {event.event_dates.length} date{event.event_dates.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublished(event)}
                        title={event.is_published ? "Unpublish" : "Publish"}
                      >
                        {event.is_published ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{event.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(event.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              <DialogDescription>
                Fill in the event details. Published events will appear on the Events page.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Hot Yoga + Contrast Therapy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={form.instructor}
                    onChange={(e) => setForm(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="e.g., Emma"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g., A Deeply Restorative Mind–Body Experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={form.short_description}
                  onChange={(e) => setForm(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Brief description shown in the event preview"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  value={form.full_description}
                  onChange={(e) => setForm(prev => ({ ...prev, full_description: e.target.value }))}
                  placeholder="Detailed description with all event information. Use **text** for bold headings."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_dates">Event Dates (comma-separated)</Label>
                  <Input
                    id="event_dates"
                    value={form.event_dates}
                    onChange={(e) => setForm(prev => ({ ...prev, event_dates: e.target.value }))}
                    placeholder="e.g., 1st February, 15th March"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_time">Event Time</Label>
                  <Input
                    id="event_time"
                    value={form.event_time}
                    onChange={(e) => setForm(prev => ({ ...prev, event_time: e.target.value }))}
                    placeholder="e.g., 3:15pm"
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {form.image_url ? (
                      <div className="relative">
                        <img 
                          src={form.image_url} 
                          alt="Primary" 
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="primary-image"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'primary');
                          }}
                        />
                        <label htmlFor="primary-image" className="cursor-pointer">
                          {uploadingImage === 'primary' ? (
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                          ) : (
                            <>
                              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Click to upload</p>
                            </>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {form.secondary_image_url ? (
                      <div className="relative">
                        <img 
                          src={form.secondary_image_url} 
                          alt="Secondary" 
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setForm(prev => ({ ...prev, secondary_image_url: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="secondary-image"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'secondary');
                          }}
                        />
                        <label htmlFor="secondary-image" className="cursor-pointer">
                          {uploadingImage === 'secondary' ? (
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                          ) : (
                            <>
                              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Click to upload</p>
                            </>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_published"
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Published (visible on website)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingEvent ? 'Update Event' : 'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminEvents;
