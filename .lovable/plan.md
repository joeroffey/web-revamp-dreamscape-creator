## Goal

Introduce **Red Light Therapy** as a complimentary, included-in-every-session amenity. Add a dedicated info page, surface it across the site, and make clear there is no extra cost and no separate booking required.

No booking flow, pricing, Stripe product, admin schedule, membership credit, or gift card change is needed.

## Changes

### 1. New page: `src/pages/RedLightTherapy.tsx` (route `/red-light-therapy`)

Sections:
- **Hero** — headline "Red Light Therapy", subhead "Included with every session at no extra cost"; full-bleed `panel.jpg`.
- **Intro** — "Red light therapy uses specific wavelengths…" copy from the doc.
- **Benefits grid** — 4 cards: Recovery & Performance, Energy & Cellular Function, Wellbeing, Skin & Health (lucide icons: Activity, Zap, Heart, Sparkles), brand colours.
- **How it works** — short photobiomodulation/ATP/circulation explainer paired with `session.jpg`.
- **Recovery protocol strip** — Sauna → Ice Bath → Red Light, 3 visual steps.
- **Guidelines** — Before / During / Safety / After cards, content lifted from the doc.
- **"Included with your visit" callout** — explicit "No booking, no extra charge — available to all guests during their session." CTA buttons → `/booking` (book a session) and `/our-hub`.
- Uses `SEOHead` + `ScrollToTop`.

### 2. Image assets (`public/images/red-light/`)
- `user-uploads://IMG_3591.jpg` → `room.jpg`
- `user-uploads://IMG_3592.jpg` → `panel.jpg`
- `user-uploads://IMG_3598.JPG` → `session.jpg`

### 3. Navigation (`src/components/Navigation.tsx`)
Add "Red Light Therapy" as a top-level link (desktop + mobile) between "Our Hub" and "Your Visit".

### 4. Our Hub page (`src/pages/OurHub.tsx`)
- Add a 5th facility card "Red Light Therapy Room" using `room.jpg` with a "Learn more →" link to `/red-light-therapy`, including the "included with every session" line.
- Add Red Light Therapy tile to the "Explore More" grid.

### 5. Your Visit page
Add a brief "Red Light Therapy is now included" mention with a link to the new page, so guests know it's part of the experience.

### 6. Home page
`src/components/HomeCTASection.tsx`: add a Red Light Therapy entry/link (per homepage SEO architecture rule).

### 7. SEO
- `src/components/LocalBusinessSchema.tsx`: add Red Light Therapy as a service in `hasOfferCatalog`.
- `public/sitemap.xml`: add `/red-light-therapy`.

### 8. Routing
- `src/App.tsx`: register `/red-light-therapy` route.

### 9. Memory
Save a feature memory noting Red Light Therapy is a complimentary, no-booking amenity included with every session — so future changes don't accidentally add pricing or booking flows.
