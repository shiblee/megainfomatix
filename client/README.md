# Client — React + Vite

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/ (+ pre-rendered HTML, sitemap.xml, robots.txt)
npm run preview    # serve the build locally
```

`VITE_API_URL` in `.env` points at the Node.js API (default `http://localhost:5050/api`).

## Conventions

| Folder | Put here |
|---|---|
| `pages/` | Route-level screens (one per route) |
| `components/` | Reusable UI pieces |
| `layouts/` | Page shells rendering `<Outlet />` |
| `routes/index.jsx` | The route registry (single place to add pages) |
| `services/` | All HTTP calls, built on `api.js` (never call `fetch` in components) |
| `context/` + `hooks/` | Shared state (`useAuth`) and reusable logic (`useAsync`) |
| `config/` | Env values and navigation items |
| `styles/global.css` | Design tokens and base styles |

`pages/Home.jsx` is the index page; its SEO text lives in `content/site.js`. See [SEO.md](../SEO.md).
Note: Vite uses `client/index.html` as its HTML entry. `public/` holds only static assets.
