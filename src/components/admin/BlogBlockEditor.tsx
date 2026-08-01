import { useRef, useState } from "react";
import { BlogBlock, newId } from "@/lib/blogBlocks";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Image as ImageIcon, Quote, Trash2, Type, Heading as HeadingIcon, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
}

const SIZE_LABELS: Array<{ value: "small" | "medium" | "full"; label: string }> = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "full", label: "Full" },
];

export const BlogBlockEditor = ({ blocks, onChange }: Props) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<BlogBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as BlogBlock) : b)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange(copy);
  };

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const add = (block: BlogBlock) => onChange([...blocks, block]);

  const handleParagraphChange = (id: string, value: string) => {
    // Detect double-newline → split into separate paragraph blocks
    if (value.includes("\n\n")) {
      const parts = value.split(/\n{2,}/).map((t) => t);
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const before = blocks.slice(0, idx);
      const after = blocks.slice(idx + 1);
      const newBlocks: BlogBlock[] = parts.map((text, i) =>
        i === 0
          ? ({ id, type: "paragraph", text } as BlogBlock)
          : ({ id: newId(), type: "paragraph", text } as BlogBlock)
      );
      onChange([...before, ...newBlocks, ...after]);
    } else {
      update(id, { text: value } as Partial<BlogBlock>);
    }
  };

  const uploadImage = async (id: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setUploadingId(id);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${newId()}.${ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      update(id, { url: data.publicUrl } as Partial<BlogBlock>);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">
          Start your post by adding a block below.
        </div>
      )}

      {blocks.map((block, i) => (
        <div key={block.id} className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {block.type}
              {block.type === "heading" ? ` H${block.level}` : ""}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => move(block.id, -1)} disabled={i === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => move(block.id, 1)} disabled={i === blocks.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(block.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {block.type === "paragraph" && (
            <Textarea
              value={block.text}
              onChange={(e) => handleParagraphChange(block.id, e.target.value)}
              placeholder="Write a paragraph... press Enter twice to start a new paragraph."
              rows={4}
            />
          )}

          {block.type === "heading" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {[2, 3].map((lvl) => (
                  <Button
                    key={lvl}
                    type="button"
                    size="sm"
                    variant={block.level === lvl ? "default" : "outline"}
                    onClick={() => update(block.id, { level: lvl as 2 | 3 } as Partial<BlogBlock>)}
                  >
                    H{lvl}
                  </Button>
                ))}
              </div>
              <Input
                value={block.text}
                onChange={(e) => update(block.id, { text: e.target.value } as Partial<BlogBlock>)}
                placeholder="Heading text"
              />
            </div>
          )}

          {block.type === "quote" && (
            <Textarea
              value={block.text}
              onChange={(e) => update(block.id, { text: e.target.value } as Partial<BlogBlock>)}
              placeholder="A pull quote..."
              rows={3}
            />
          )}

          {block.type === "image" && (
            <div className="space-y-3">
              {block.url ? (
                <div className="rounded-lg overflow-hidden border max-h-64 flex items-center justify-center bg-muted">
                  <img src={block.url} alt={block.alt} className="max-h-64 w-auto object-contain" />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingId === block.id ? "Uploading..." : "Click to upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(block.id, f);
                    }}
                  />
                </label>
              )}
              {block.url && (
                <div className="flex items-center gap-2">
                  <label className="text-sm cursor-pointer underline text-muted-foreground">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(block.id, f);
                      }}
                    />
                  </label>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Caption / alt text</Label>
                <Input
                  value={block.alt}
                  onChange={(e) => update(block.id, { alt: e.target.value } as Partial<BlogBlock>)}
                  placeholder="Describe the image"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display size</Label>
                <div className="flex gap-2">
                  {SIZE_LABELS.map((s) => (
                    <Button
                      key={s.value}
                      type="button"
                      size="sm"
                      variant={block.size === s.value ? "default" : "outline"}
                      onClick={() => update(block.id, { size: s.value } as Partial<BlogBlock>)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button type="button" variant="outline" size="sm" onClick={() => add({ id: newId(), type: "paragraph", text: "" })}>
          <Type className="h-4 w-4 mr-1" /> Paragraph
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add({ id: newId(), type: "heading", level: 2, text: "" })}>
          <HeadingIcon className="h-4 w-4 mr-1" /> Heading
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add({ id: newId(), type: "image", url: "", alt: "", size: "full" })}>
          <ImageIcon className="h-4 w-4 mr-1" /> Image
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add({ id: newId(), type: "quote", text: "" })}>
          <Quote className="h-4 w-4 mr-1" /> Quote
        </Button>
      </div>
    </div>
  );
};
