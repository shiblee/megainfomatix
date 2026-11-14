# Deployment: megainfomatix.com (Render + GoDaddy)

```text
https://megainfomatix.com, https://www.megainfomatix.com → React static site   (megainfomatix-web)
https://api.megainfomatix.com                           → Node.js API          (megainfomatix-api)
internal only                                           → Python analytics     (megainfomatix-analytics)
internal only                                           → PostgreSQL           (megainfomatix-db)
```

Everything is defined in [`render.yaml`](render.yaml). Every push to `main` redeploys automatically.

## 1. Create the services on Render

1. Sign up at https://render.com with **"Sign in with GitHub"**, and allow access to `shiblee/megainfomatix`.
2. Dashboard → **New +** → **Blueprint** → select the `megainfomatix` repo → **Connect**.
3. Render reads `render.yaml` and lists 1 database and 3 services. Choose a plan for each.
   The static site is free; the API, the Python private service and PostgreSQL need paid instance types.
   See https://render.com/pricing for current prices.
4. Click **Apply**. The first build takes about 5–10 minutes. Wait until all four show **Live**.
5. Check the API's temporary URL: `https://megainfomatix-api.onrender.com/api/health` should return
   `"database":"ok","python":"ok"`. If a service name was already taken, Render adds a suffix;
   use the exact `*.onrender.com` names shown in the dashboard below.

`JWT_SECRET` is generated automatically. `DATABASE_URL` and `PYTHON_SERVICE_URL` are wired between services.

## 2. Point the domain at Render (GoDaddy DNS)

GoDaddy → **My Products** → next to **megainfomatix.com** click **DNS** (or Manage → DNS).

**Remove**
- the `A` record with name `@` that points to GoDaddy's parking page ("Parked")
- any `CNAME` record named `www` (usually pointing to `@` or `megainfomatix.com`)

**Add**

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `216.24.57.1` (confirm in Render → megainfomatix-web → Settings → Custom Domains) | 1 hour |
| CNAME | `www` | `megainfomatix-web.onrender.com` | 1 hour |
| CNAME | `api` | `megainfomatix-api.onrender.com` | 1 hour |

## 3. Verify the domains and HTTPS

1. Render → **megainfomatix-web** → Settings → **Custom Domains**: `megainfomatix.com` and
   `www.megainfomatix.com` are already listed from `render.yaml`. Click **Verify**.
2. Same for **megainfomatix-api** → `api.megainfomatix.com`.
3. Render issues free SSL certificates automatically after verification. DNS changes usually
   apply within minutes, but can take up to 48 hours.

## 4. Check it works

- https://megainfomatix.com → "Coming soon" page; **System status** shows all three services as **Connected**
- https://api.megainfomatix.com/api/health → `"status":"ok"`

## Updating the site

```bash
git add -A
git commit -m "Describe the change"
git push
```

Render rebuilds and redeploys the services that changed.

## Notes

- Reports and monitoring history that Python writes to `python/output/` are lost on each redeploy, because Render's
  disk is temporary. Store them in the database or object storage, or attach a Render Disk, when that history matters.
- Environment variables can be changed in Render → service → **Environment**. `VITE_*` values are
  baked in at build time, so changing them needs a redeploy of the static site.
- Registration is open to anyone. Restrict it, or create an admin account, before announcing the site.
