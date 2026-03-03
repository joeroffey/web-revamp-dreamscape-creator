

## SEO Enhancement Plan

Based on the audit recommendations, here is what can be done and what is already complete or not applicable.

---

### Already Done (No Action Needed)

- **LocalBusinessSchema enhancements** (`@id`, `areaServed`, `hasMap`, multiple images, `priceRange`) -- all already present
- **og:image default fallback** -- already configured in `SEOHead` component with a default image

### Not Feasible

- **Pre-rendering (SSG)** -- requires migrating to Next.js or a similar framework, which is outside Lovable's capabilities. Google handles JavaScript-rendered content well for modern SPAs, so this is not critical.

---

### Changes To Implement

#### 1. Add FAQ Schema (JSON-LD) to Your Visit Page

The `/your-visit` page already has a rich FAQ section with 6 questions. Adding `FAQPage` structured data will make these eligible for rich results in Google Search, which significantly boosts click-through rates.

**File:** `src/pages/YourVisit.tsx`
- Add a JSON-LD `FAQPage` schema block via `react-helmet-async` containing all 6 existing FAQ items

#### 2. Add FAQ Sections + Schema to Key Service Pages

Add short FAQ sections with structured data to pages that currently lack them, boosting content depth and enabling rich results:

**a. Booking page** (`src/pages/Booking.tsx`)
- Add 4-5 FAQs below the booking form (e.g., "How long is a session?", "What's the difference between communal and private?", "Do I need to bring anything?", "Can I cancel or reschedule?")
- Include `FAQPage` JSON-LD schema

**b. Memberships page** (`src/pages/Memberships.tsx`)
- Add 4-5 FAQs below membership cards (e.g., "Can I cancel anytime?", "What happens if I miss a session?", "Can I upgrade my membership?", "Is there a joining fee?")
- Include `FAQPage` JSON-LD schema

**c. Gift Cards page** (`src/pages/GiftCards.tsx`)
- Add 3-4 FAQs below the purchase form (e.g., "How long are gift cards valid?", "Can I use a gift card for memberships?", "How does the recipient redeem it?")
- Include `FAQPage` JSON-LD schema

#### 3. Create Reusable FAQ Schema Component

To keep things clean, create a small reusable component that takes an array of Q&A pairs and renders both the visible accordion and the JSON-LD schema.

**New file:** `src/components/FAQSchema.tsx`
- Accepts `faqs: { question: string; answer: string }[]` prop
- Renders JSON-LD `FAQPage` schema via Helmet
- Optionally renders the visible FAQ accordion UI

---

### Technical Summary

| File | Change |
|---|---|
| `src/components/FAQSchema.tsx` | New reusable component for FAQ structured data |
| `src/pages/YourVisit.tsx` | Add FAQPage JSON-LD schema for existing 6 FAQs |
| `src/pages/Booking.tsx` | Add FAQ section + schema (4-5 questions) |
| `src/pages/Memberships.tsx` | Add FAQ section + schema (4-5 questions) |
| `src/pages/GiftCards.tsx` | Add FAQ section + schema (3-4 questions) |

### Impact

- FAQ rich results can increase click-through rate by 20-30%
- Additional content depth on service pages improves topical relevance
- No visual or functional changes to existing features -- FAQs are added below existing content
- Structured data validates instantly with Google's Rich Results Test

