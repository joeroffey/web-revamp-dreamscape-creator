## Goal

Replace the current single-textarea, single-image blog system with a **block-based editor** so admins can mix paragraphs and images in any order, upload images directly (no URLs), and pick a simple preset size — without touching pixel dimensions. Then redesign the public `/blog` page so each post looks like an editorial article rather than a repeating background.

---

## 1. Storage & Data Model

**New Supabase storage bucket: `blog-images`** (public, with admin-only write RLS on `storage.objects`).

**`blog_posts` table — add column:**
- `content_blocks jsonb` — array of blocks. Existing `content` (text) is kept for backward compatibility; on first edit of a legacy post we auto-convert it into paragraph blocks.

**Block shape:**
```
{ id, type: "paragraph", text: string }
{ id, type: "image", url: string, alt: string, size: "small" | "medium" | "full", align: "left" | "center" }
{ id, type: "heading", text: string, level: 2 | 3 }
{ id, type: "quote", text: string }
```

Image `size` maps to fixed Tailwind widths so admin never types pixels:
- `small` → `max-w-sm` (inline, ~384px)
- `medium` → `max-w-2xl` (~672px)
- `full` → `w-full` (full article width, default)

---

## 2. Admin Editor (`ModernBlogManagement.tsx`)

Replace the single content `Textarea` with a **stacked block editor**:

```text
┌─ Title ──────────────────────────────┐
├─ Excerpt ────────────────────────────┤
├─ Cover image (upload) ───────────────┤
│                                      │
│  [Block 1: Paragraph]      ↑ ↓ ✕    │
│  [Block 2: Image — medium] ↑ ↓ ✕    │
│  [Block 3: Paragraph]      ↑ ↓ ✕    │
│                                      │
│  + Paragraph  + Heading  + Image  + Quote
└──────────────────────────────────────┘
```

Behaviour:
- **Add block**: buttons at the bottom insert the chosen block type.
- **Reorder**: up/down arrows on each block (no drag-and-drop dependency needed).
- **Delete**: ✕ button with confirm.
- **Paragraph block**: a `Textarea` — when admin presses Enter twice, we auto-split into two paragraph blocks (handles "paragraph space detection"). On render, single newlines become `<br/>`.
- **Image block**: drag-and-drop or click-to-upload → uploads to `blog-images` bucket via Supabase Storage → stores public URL. Inline preview. Size selector = three buttons (Small / Medium / Full). Optional alt text field (required for accessibility, prefilled with post title).
- **Heading / Quote blocks**: simple `Input` / `Textarea`.

Validation: title + at least one non-empty block required.

Existing posts: when opened in the editor, if `content_blocks` is null we split `content` on `\n\n` into paragraph blocks so the admin sees their old text as editable blocks immediately.

---

## 3. Public Blog Page (`src/pages/Blog.tsx`)

Redesign to feel like a real journal:

**Hero / list page**
- Keep the cream-toned hero header.
- Below it, render posts as an **editorial list**: each post is a large card with cover image on one side and Title + Date + Excerpt + "Read article →" on the other. Alternate sides on desktop, stack on mobile. Use the link-tile pattern (corner accents, sliding arrow) per `mem://style/link-tile-pattern`.
- Clicking a card navigates to `/blog/:id` (new route).

**Article page (`/blog/:id`)**
- Centered max-w-3xl column.
- Eyebrow (date) → Title → optional cover image (full-bleed within column, rounded) → rendered blocks.
- Block rendering:
  - `paragraph`: `<p>` with generous leading + spacing, single `\n` → `<br/>`.
  - `heading`: `<h2>` / `<h3>` with brand serif weight.
  - `image`: respects `size` preset, centered, rounded, with optional caption from alt.
  - `quote`: left brown border, italic, larger text.
- Bottom: "Back to journal" link + the existing "Ready to experience contrast therapy?" CTA tile.

This kills the "same background image throughout" problem because each post controls its own imagery and layout, and the public list shows distinct covers per post.

---

## 4. Routing & SEO

- Add `<Route path="/blog/:id" element={<BlogPost />} />` in `src/App.tsx`.
- New page `src/pages/BlogPost.tsx` with `SEOHead` using post title + excerpt and `ScrollToTop`.
- Update sitemap generation if dynamic, otherwise leave (posts are not in static sitemap today).

---

## Technical details

**Files to add**
- `src/pages/BlogPost.tsx` — single article view.
- `src/components/admin/BlogBlockEditor.tsx` — the block editor (paragraph / heading / image / quote blocks, reordering, upload).
- `src/components/blog/BlogBlocks.tsx` — renderer used by `BlogPost.tsx`.

**Files to edit**
- `src/components/admin/ModernBlogManagement.tsx` — swap `Textarea` for `BlogBlockEditor`; cover image upload (replace URL `Input` with file upload to `blog-images`); save `content_blocks` on insert/update; keep `content` synced (concatenated paragraph text) for legacy/search.
- `src/pages/Blog.tsx` — new editorial list, link to `/blog/:id`, drop inline full-content rendering.
- `src/App.tsx` — add `/blog/:id` route.

**Migrations**
1. `alter table blog_posts add column content_blocks jsonb;`
2. Create `blog-images` storage bucket (public) + RLS policies on `storage.objects`:
   - Public SELECT on bucket `blog-images`.
   - Admin-only INSERT/UPDATE/DELETE using `is_admin(auth.uid())`.

**Image upload flow**
- Client uses `supabase.storage.from('blog-images').upload(...)` with a `crypto.randomUUID()` filename.
- Get public URL via `getPublicUrl`.
- Store URL in the block.

---

## Out of scope

- Drag-and-drop block reordering (using up/down arrows is simpler and sufficient).
- Rich text inside paragraphs (bold/italic/links) — can be a follow-up if needed.
- Image cropping — admin uploads at desired aspect; size preset only controls displayed width.
