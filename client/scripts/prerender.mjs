/**
 * Build step after `vite build` + `vite build --ssr`:
 *   - renders every route with handle.prerender to static HTML (dist/<path>/index.html)
 *     with full SEO head: title, description, canonical, robots, Open Graph, Twitter, JSON-LD
 *   - writes dist/spa.html: empty app shell (noindex) for client-only routes and 404s
 *   - writes dist/route-manifest.json (used by the Node server for status codes + noindex)
 *   - writes dist/sitemap.xml and dist/robots.txt
 *
 * Usage: node scripts/prerender.mjs [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js');

const { render, listRoutes, SITE, homeStructuredData } = await import(pathToFileURL(SSR_ENTRY).href);

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
  throw new Error('dist/index.html is missing the <!--app-head--> / <!--app-html--> placeholders');
}

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
const absolute = (urlPath) => `${SITE.url}${urlPath}`;

function headFor(route) {
  const title = route.title || SITE.title;
  const description = route.description || SITE.description;
  const url = absolute(route.path === '/' ? '/' : route.path);
  const image = absolute(SITE.image);
  const tags = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${SITE.name}: ${SITE.tagline}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  if (route.path === '/') {
    tags.push(`<script type="application/ld+json">${jsonLd(homeStructuredData())}</script>`);
  }
  return { title, head: tags.join('\n    ') };
}

const outputFile = (urlPath) => (urlPath === '/' ? 'index.html' : `${urlPath.replace(/^\//, '')}/index.html`);

const allRoutes = listRoutes();
const prerendered = allRoutes.filter((route) => route.prerender);
const manifest = { pages: {}, app: allRoutes.filter((route) => !route.prerender).map((route) => route.path) };

for (const route of prerendered) {
  const { title, head } = headFor(route);
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', render(route.path));

  const file = outputFile(route.path);
  fs.mkdirSync(path.dirname(path.join(DIST, file)), { recursive: true });
  fs.writeFileSync(path.join(DIST, file), html);
  manifest.pages[route.path] = file;
  console.log(`  prerendered ${route.path} -> ${file}`);
}

// Client-rendered shell: never indexed.
fs.writeFileSync(
  path.join(DIST, 'spa.html'),
  template.replace('<!--app-head-->', '<meta name="robots" content="noindex" />').replace('<!--app-html-->', ''),
);
fs.writeFileSync(path.join(DIST, 'route-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const today = new Date().toISOString().slice(0, 10);
const urls = prerendered
  .map(
    (route) => `  <url>
    <loc>${absolute(route.path === '/' ? '/' : route.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq || 'monthly'}</changefreq>
    <priority>${route.priority || '0.5'}</priority>
  </url>`,
  )
  .join('\n');
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absolute('/sitemap.xml')}\n`,
);

console.log(`  wrote spa.html, route-manifest.json, sitemap.xml (${prerendered.length} url), robots.txt`);
