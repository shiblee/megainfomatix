# SEO: how megainfomatix.com is set up

Lighthouse (mobile, live site, 14 Nov 2026): **Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100**
(LCP 0.8 s, CLS 0, TBT 0 ms).

## What is in place

| Area | Implementation |
|---|---|
| Crawlable HTML | Pages marked `handle: { prerender: true }` in `client/src/routes/routes.jsx` are rendered to static HTML at build time (`client/scripts/prerender.mjs`), so Google and link previews see the full content without JavaScript. React then attaches to it (hydration). |
| Title & description | `client/src/content/site.js` → `SITE.title` (≤ 60 chars) and `SITE.description` (≤ 160 chars) |
| Canonical URL | `https://megainfomatix.com/`; `www.` and `http://` 301-redirect to it, `/index.html` 301-redirects to `/` |
| Robots | Indexable pages: `index, follow, max-image-preview:large`. Client-only pages (e.g. `/status`) and unknown URLs: `X-Robots-Tag: noindex`; unknown URLs return a real **404** |
| Social sharing | Open Graph + Twitter card tags with a 1200×630 image (`client/public/og-image.png`) |
| Structured data | JSON-LD `Organization`, `WebSite`, `WebPage`, `FAQPage` (built from `SITE` and `FAQ` in `site.js`) |
| Content | One `<h1>`, a logical `<h2>` per section, a visible FAQ matching the FAQ structured data, semantic landmarks (`header`, `nav`, `main`, `footer`) |
| Crawl files | `robots.txt` and `sitemap.xml` are generated on every build from the pre-rendered routes |
| Icons | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest` |
| Speed | gzip compression, immutable caching for hashed assets, static HTML (no render-blocking data fetch) |

## Changing the wording
Edit `client/src/content/site.js` (title, description, FAQ) or the section text in
`client/src/pages/Home.jsx`, then run `./scripts/deploy.sh`. The meta tags, FAQ structured data
and sitemap update automatically.

## Adding a page that should rank
1. Create `client/src/pages/MyPage.jsx`.
2. In `client/src/routes/routes.jsx` add
   `{ path: 'my-page', element: <MyPage />, handle: { prerender: true, title: '…', description: '…' } }`.
3. Deploy. The page is pre-rendered, gets its own title, description and canonical URL, and is added to `sitemap.xml`.

## Google Search Console (one-time, by the domain owner)
1. Open https://search.google.com/search-console → **Add property** → **Domain** → `megainfomatix.com`.
2. Verify ownership: Google shows a TXT record. Because the domain is at GoDaddy, Search Console offers
   **"Verify with GoDaddy"** (one click). Otherwise add the TXT record in GoDaddy → DNS → Add New Record.
3. **Sitemaps** → enter `sitemap.xml` → **Submit**.
4. **URL Inspection** → `https://megainfomatix.com/` → **Request indexing**.
5. Optional: Bing Webmaster Tools (https://www.bing.com/webmasters) → **Import from Google Search Console**.

## Checking shares
- Facebook / WhatsApp / LinkedIn preview: https://developers.facebook.com/tools/debug/ and
  https://www.linkedin.com/post-inspector/ (paste the URL, click **Scrape again** after changes)
- Structured data: https://search.google.com/test/rich-results
