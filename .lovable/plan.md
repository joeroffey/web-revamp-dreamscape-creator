
## SEO Issues Fix Plan

Based on the Screaming Frog report, here are the issues that can be fixed without affecting site functionality, grouped by priority.

---

### HIGH Priority

**1. Fix Multiple Conflicting Canonicals (13 pages)**
The `index.html` has a hardcoded `<link rel="canonical">` and each page's `SEOHead` component adds another one via react-helmet. This creates two conflicting canonicals per page.

- **Fix:** Remove the `<link rel="canonical">` from `index.html`. The per-page `SEOHead` component already handles this correctly.

**2. Fix Multiple Meta Descriptions (14 pages)**
Same root cause -- `index.html` has a hardcoded `<meta name="description">` and `SEOHead` adds a page-specific one. Two descriptions confuse search engines.

- **Fix:** Remove the `<meta name="description">` from `index.html`. Per-page descriptions via `SEOHead` are already correct.

---

### MEDIUM Priority

**3. Expand Short Page Titles (8 pages below 30 characters)**
Several page titles are too short to make use of available keyword space. Updated titles:

| Current Title | New Title |
|---|---|
| About Us \| Revitalise Hub | About Us - Cold Water Therapy Centre \| Revitalise Hub |
| Contact \| Revitalise Hub | Contact Us - Book Your Visit \| Revitalise Hub |
| Blog \| Revitalise Hub | Blog - Contrast Therapy Insights \| Revitalise Hub |
| Events \| Revitalise Hub | Events - Wellness Workshops \| Revitalise Hub |
| Gift Cards \| Revitalise Hub | Gift Cards - Wellness Vouchers \| Revitalise Hub |
| Our Hub \| Revitalise Hub | Our Hub - Facilities & Location \| Revitalise Hub |
| Your Visit \| Revitalise Hub | Your Visit - Session Guide \| Revitalise Hub |
| Booking \| Revitalise Hub | Book a Session - Ice Bath & Sauna \| Revitalise Hub |

**4. Add Missing SEOHead to RedeemGiftCard page**
This page has no SEO metadata at all.

---

### LOW Priority

**5. Fix H1 Missing (1 page)**
The `RedeemGiftCard` page renders its h1, but the OurHub page is missing a Footer (cosmetic, already has h1). Most likely candidate is a page where the h1 only appears conditionally. Will verify and ensure all pages have a proper h1.

**6. Add H2 to pages missing them (3 pages)**
Pages like Privacy Policy, Terms & Conditions, and Cookie Policy use `<h2>` elements already. The 3 pages flagged are likely the success/redirect pages or pages with sparse content. The Home page's main section uses h3 in BookingCards -- will promote to h2 where appropriate.

---

### Not fixable within Lovable (noted for awareness)

- **Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers** -- These are server-level response headers. They need to be configured in your hosting provider (Vercel) via `vercel.json`, not in the app code. I will add these to `vercel.json`.
- **JavaScript-rendered content** -- Inherent to React SPAs. Google handles this fine, but it's flagged as a warning.
- **Blocked resources by robots.txt** -- Will check if any linked internal URL is accidentally blocked.
- **Images over 100KB / missing size attributes** -- Can be improved but would require image optimisation and adding width/height to every `<img>` tag across the site. This is a separate task.

---

### Technical Summary of Changes

| File | Change |
|---|---|
| `index.html` | Remove hardcoded canonical and meta description |
| `src/components/SEOHead.tsx` | Update title format to use longer, keyword-rich titles |
| `src/pages/About.tsx` | Update SEOHead title |
| `src/pages/Contact.tsx` | Update SEOHead title |
| `src/pages/Blog.tsx` | Update SEOHead title |
| `src/pages/Events.tsx` | Update SEOHead title |
| `src/pages/GiftCards.tsx` | Update SEOHead title |
| `src/pages/OurHub.tsx` | Update SEOHead title |
| `src/pages/YourVisit.tsx` | Update SEOHead title |
| `src/pages/Booking.tsx` | Update SEOHead title |
| `src/pages/Memberships.tsx` | Update SEOHead title |
| `src/pages/FitnessRecovery.tsx` | Update SEOHead title |
| `src/pages/RedeemGiftCard.tsx` | Add SEOHead component |
| `vercel.json` | Add security response headers |

No visual or functional changes to the site. Only metadata and response headers are affected.
