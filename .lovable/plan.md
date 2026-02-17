
## SEO Optimisation: Sitemap, Meta Tags, and robots.txt

### 1. Create `public/sitemap.xml`

A static sitemap listing all public-facing pages with your production domain. Only indexable pages will be included (no admin, auth, success, or utility pages).

Pages to include:
- `/` (Home) -- priority 1.0
- `/about` -- priority 0.8
- `/booking` -- priority 0.9
- `/memberships` -- priority 0.8
- `/gift-cards` -- priority 0.7
- `/events` -- priority 0.7
- `/blog` -- priority 0.7
- `/fitness-recovery` -- priority 0.7
- `/your-visit` -- priority 0.7
- `/our-hub` -- priority 0.6
- `/contact` -- priority 0.6
- `/privacy-policy` -- priority 0.3
- `/terms-conditions` -- priority 0.3
- `/cookie-policy` -- priority 0.3
- `/redeem-gift-card` -- priority 0.4

Pages excluded (not for search engines): `/auth`, `/dashboard`, `/reset-password`, `/booking-success`, `/membership-success`, `/gift-card-success`, `/intro-offer-success`, all `/admin/*` routes.

### 2. Update `public/robots.txt`

- Add `Sitemap: https://www.revitalisehub.co.uk/sitemap.xml`
- Add `Disallow` rules for admin, auth, dashboard, and success pages so crawlers skip them
- Simplify to a single `User-agent: *` block

### 3. Enhance `index.html` meta tags

- Update `<title>` to: `Revitalise Hub | Cold Water & Contrast Therapy | Lymington`
- Update `meta description` to a keyword-rich description
- Add `og:url` and `og:site_name` meta tags
- Add canonical link tag
- Add `twitter:card` meta tag (without any third-party references)

### 4. Add per-page `<title>` and meta descriptions

Install `react-helmet-async` and add unique titles and descriptions to key pages so each page has its own SEO-friendly metadata rather than sharing the generic one from `index.html`. Pages to update:
- Home, About, Booking, Memberships, Gift Cards, Events, Blog, Fitness Recovery, Your Visit, Our Hub, Contact, Privacy Policy, Terms, Cookie Policy

### Technical Details

- `sitemap.xml` will use the standard XML sitemap protocol with `lastmod` dates and `changefreq` values
- `react-helmet-async` will wrap the app in a `HelmetProvider` and each page will use `<Helmet>` to set page-specific titles and meta descriptions
- No references to Lovable anywhere in any of these changes
