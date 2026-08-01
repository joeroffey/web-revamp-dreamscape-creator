export type BlogBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "image"; url: string; alt: string; size: "small" | "medium" | "full" }
  | { id: string; type: "quote"; text: string };

export const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const imageSizeClass = (size: "small" | "medium" | "full") => {
  switch (size) {
    case "small": return "max-w-sm";
    case "medium": return "max-w-2xl";
    case "full":
    default: return "w-full";
  }
};

// Convert legacy plain content into paragraph blocks
export const contentToBlocks = (content: string): BlogBlock[] => {
  if (!content) return [];
  return content
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ id: newId(), type: "paragraph" as const, text }));
};

// Flatten blocks back into plain text (used to keep `content` in sync for search/legacy)
export const blocksToPlainText = (blocks: BlogBlock[]): string =>
  blocks
    .map((b) => {
      if (b.type === "paragraph" || b.type === "quote") return b.text;
      if (b.type === "heading") return b.text;
      if (b.type === "image") return b.alt ? `[Image: ${b.alt}]` : "";
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

export const isBlocksArray = (v: unknown): v is BlogBlock[] =>
  Array.isArray(v) && v.every((b) => b && typeof b === "object" && "type" in (b as object));
