import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { BlogBlockEditor } from "./BlogBlockEditor";
import { BlogBlock, blocksToPlainText, contentToBlocks, isBlocksArray, newId } from "@/lib/blogBlocks";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  content_blocks: BlogBlock[] | null;
  excerpt: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogFormData {
  title: string;
  excerpt: string;
  image_url: string;
  is_published: boolean;
  blocks: BlogBlock[];
}

const initialFormData = (): BlogFormData => ({
  title: "",
  excerpt: "",
  image_url: "",
  is_published: false,
  blocks: [{ id: newId(), type: "paragraph", text: "" }],
});

export const ModernBlogManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((p) => ({
        ...p,
        content_blocks: isBlocksArray(p.content_blocks) ? p.content_blocks : null,
      })) as BlogPost[];
    },
  });

  const buildPayload = (data: BlogFormData) => {
    const blocks = data.blocks.filter((b) => {
      if (b.type === "image") return !!b.url;
      return "text" in b ? b.text.trim().length > 0 : true;
    });
    return {
      title: data.title,
      content: blocksToPlainText(blocks),
      content_blocks: blocks as any,
      excerpt: data.excerpt || null,
      image_url: data.image_url || null,
      is_published: data.is_published,
    };
  };

  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const payload = buildPayload(data);
      const { error } = await supabase.from("blog_posts").insert({
        ...payload,
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      handleCloseDialog();
      toast.success("Blog post created");
    },
    onError: (e) => toast.error("Failed to create: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogFormData }) => {
      const payload: any = buildPayload(data);
      if (data.is_published && !editingPost?.published_at) {
        payload.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      handleCloseDialog();
      toast.success("Blog post updated");
    },
    onError: (e) => toast.error("Failed to update: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Blog post deleted");
    },
    onError: (e) => toast.error("Failed to delete: " + e.message),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const update: any = { is_published };
      if (is_published) update.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    const blocks =
      post.content_blocks && post.content_blocks.length > 0
        ? post.content_blocks
        : contentToBlocks(post.content);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || "",
      image_url: post.image_url || "",
      is_published: post.is_published,
      blocks: blocks.length > 0 ? blocks : [{ id: newId(), type: "paragraph", text: "" }],
    });
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingPost(null);
    setFormData(initialFormData());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const hasContent = formData.blocks.some((b) =>
      b.type === "image" ? !!b.url : "text" in b && b.text.trim().length > 0
    );
    if (!hasContent) {
      toast.error("Add at least one block of content");
      return;
    }
    if (editingPost) updateMutation.mutate({ id: editingPost.id, data: formData });
    else createMutation.mutate(formData);
  };

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `cover-${newId()}.${ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setFormData((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Cover image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const BlogForm = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="A clear, compelling title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Short summary shown on the blog list..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Cover image</Label>
        {formData.image_url ? (
          <div className="space-y-2">
            <div className="rounded-lg overflow-hidden border">
              <img src={formData.image_url} alt="Cover" className="w-full h-48 object-cover" />
            </div>
            <div className="flex gap-2">
              <label className="text-sm cursor-pointer underline text-muted-foreground">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                />
              </label>
              <button
                type="button"
                className="text-sm underline text-destructive"
                onClick={() => setFormData((f) => ({ ...f, image_url: "" }))}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploadingCover ? "Uploading..." : "Click to upload cover image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label>Article content</Label>
        <BlogBlockEditor
          blocks={formData.blocks}
          onChange={(blocks) => setFormData((f) => ({ ...f, blocks }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
        <Label htmlFor="is_published">Publish</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {editingPost ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light">Blog Management</h2>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>

        <Dialog
          open={isCreateOpen || !!editingPost}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsCreateOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
            </DialogHeader>
            {BlogForm}
          </DialogContent>
        </Dialog>
      </div>

      {posts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts?.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">{post.title}</CardTitle>
                      <Badge variant={post.is_published ? "default" : "secondary"}>
                        {post.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                  {post.image_url && (
                    <div className="ml-4 w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {post.published_at
                      ? `Published ${format(new Date(post.published_at), "MMM d, yyyy")}`
                      : `Created ${format(new Date(post.created_at), "MMM d, yyyy")}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        togglePublishMutation.mutate({ id: post.id, is_published: !post.is_published })
                      }
                    >
                      {post.is_published ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Unpublish</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> Publish</>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{post.title}"? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(post.id)}
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
    </div>
  );
};
