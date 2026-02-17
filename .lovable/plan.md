

## Remove All Lovable Branding

This plan removes every trace of Lovable from the codebase so that no SEO tool, crawler, or developer inspecting your site can tell it was built with Lovable. Nothing functional will break.

### Changes

**1. `index.html` -- Remove Lovable OG/Twitter meta tags**
- Remove the `og:image` pointing to `lovable.dev/opengraph-image`
- Remove `twitter:site` referencing `@lovable_dev`
- Remove `twitter:image` pointing to `lovable.dev`
- Replace with your own branding (Revitalise Hub OG image or leave blank)

**2. `vite.config.ts` -- Remove lovable-tagger plugin**
- Remove the `import { componentTagger } from "lovable-tagger"` line
- Remove the `componentTagger()` call from the plugins array
- This plugin injects data attributes into components in dev mode -- not needed on Vercel

**3. `package.json` -- Remove lovable-tagger dependency**
- Remove `"lovable-tagger": "^1.1.7"` from devDependencies

**4. `README.md` -- Replace with generic project README**
- Replace the entire Lovable-branded README with a simple Revitalise Hub project description

**5. `supabase/functions/send-contact-notification/index.ts` -- Update admin link**
- Change the admin panel URL from `web-revamp-dreamscape-creator.lovable.app` to `www.revitalisehub.co.uk`

**6. `.lovable/plan.md` -- Remove**
- This is a Lovable-specific file that can be deleted

### What stays unchanged
- The `public/lovable-uploads/` folder -- these are just your uploaded images. The folder name is internal and not exposed in any meta tags or visible HTML. Renaming it would break dozens of image references across the site for no SEO benefit since the paths are only in your source code, not in any crawlable metadata.
- `package-lock.json` -- will auto-update when `lovable-tagger` is removed from `package.json`
- All site functionality, Stripe, Supabase, bookings, emails remain completely untouched

