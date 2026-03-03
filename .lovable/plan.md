

## Plan: Custom 404 Page, Image Optimization, SEO Fixes

### 1. Custom Branded 404 Page
**File: `src/pages/NotFound.tsx`** — Full rewrite

- Add `Navigation`, `Footer`, `SEOHead` (with `robots="noindex,nofollow"`)
- Branded layout with logo, friendly message, and CTAs: "Back to Home", "Book a Session", "Contact Us"
- Styled to match the site's design system

### 2. Image Optimization
**`src/components/PhotoGallery.tsx`** — Add `loading="lazy"` and `decoding="async"` to all gallery `<img>` tags

**`src/components/Navigation.tsx`** — Add `width={160}` and `height={160}` to the logo image (line 74)

**`src/components/Footer.tsx`** — Add `loading="lazy"`, `width`, `height` to footer logo (line 50)

### 3. Fix Duplicate Meta Tags in index.html
**File: `index.html`** — Remove hardcoded OG tags (lines 34-40) and Twitter tags (lines 42-44) since `SEOHead` handles these dynamically per page. Keep the static `<title>`, `<meta name="author">`, and `<meta name="keywords">`.

### 4. SEO Housekeeping
**`src/components/Footer.tsx`** — Update copyright year from 2024 to 2025

**`public/robots.txt`** — Add `Disallow: /redeem-gift-card` (missing private route)

**`public/sitemap.xml`** — Verify no changes needed (already covers all public pages, 404 should NOT be in sitemap)

### Files Changed Summary

| File | Change |
|---|---|
| `src/pages/NotFound.tsx` | Full redesign with branded layout, nav, footer, SEOHead noindex |
| `src/components/PhotoGallery.tsx` | Add `loading="lazy"` + `decoding="async"` to images |
| `src/components/Navigation.tsx` | Add `width`/`height` to logo |
| `src/components/Footer.tsx` | Add lazy loading to logo, update copyright year |
| `index.html` | Remove duplicate OG/Twitter meta tags |
| `public/robots.txt` | Add missing `Disallow: /redeem-gift-card` |

