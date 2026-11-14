# Deployment: https://megainfomatix.com (GoDaddy cPanel hosting)

MegaInfomatix runs on the same GoDaddy cPanel account as the other sites, following the
same pattern as nawaratrend.com. **Only touch the `megainfomatix` folders listed below.**
The account also hosts misoftwaresolutions.com (main domain, `public_html`) and several addon domains.

```text
https://megainfomatix.com ─► Apache + Passenger ─► ~/megainfomatix/server   (Node.js 22)
                                                   ├─ serves the React build  (~/megainfomatix/client/dist)
                                                   ├─ /api/*                  REST API
                                                   ├─ MySQL "megainfomatix"   (cPanel database)
                                                   └─ runs Python on demand   (~/megainfomatix/python/venv, Python 3.11)
cron, every 15 min ─► python src/main.py monitor --once   (log: ~/megainfomatix/logs/monitor.log)
```

There is no separate Python web service. Shared hosting doesn't allow long-running background
processes, so Node runs `python src/main.py query <operation>` when an analytics endpoint is called
(`PYTHON_BIN` in the server's `.env`).

## Server layout

| Path | What |
|---|---|
| `~/megainfomatix/server` | Node.js app (with `.env`), outside public_html so secrets can't be downloaded |
| `~/megainfomatix/client/dist` | Built React app, served by the Node app |
| `~/megainfomatix/python` | Python layer (with `.env`), `venv/` and `output/` (reports, monitoring history) |
| `~/megainfomatix/logs/monitor.log` | Output of the scheduled monitoring job |
| `~/public_html/megainfomatix.com/.htaccess` | Passenger settings that run the Node app for the domain |
| `~/nodejs/bin/node` | Node.js 22, shared by the Node apps on this account |
| MySQL `megainfomatix`, user `megainfomatix` | Credentials only in `deploy/production.env` (on the Mac) and the server `.env` files |
| SSH | `ssh mjgykn3s9utp@184.168.114.12` with this Mac's key |

## Deploying an update (one command)

From the project folder on the Mac:

```bash
./scripts/deploy.sh
```

It builds the React app, uploads everything with rsync, creates or updates the Python virtualenv
when `python/requirements.txt` changes, and restarts the app. Database migrations run automatically on start
(`DB_AUTO_MIGRATE=true`). Data in MySQL, reports and monitoring history are kept.

`deploy/production.env` holds the production settings, including the database password and JWT secret.
It is git-ignored, so **never commit or share it**. `deploy/production.env.example` shows the format.

## First-time setup (already done on 14 Nov 2026, kept for reference)

1. **Addon domain** (cPanel → Domains → Create A New Domain): `megainfomatix.com`, untick
   "Share document root", document root `public_html/megainfomatix.com`.
2. **Database**: `megainfomatix` + user `megainfomatix` with ALL PRIVILEGES (created with `uapi Mysql ...`).
3. **App**: `./scripts/deploy.sh`.
4. **Passenger**: `~/public_html/megainfomatix.com/.htaccess`:
   ```apache
   PassengerEnabled on
   PassengerAppRoot "/home/mjgykn3s9utp/megainfomatix/server"
   PassengerBaseURI "/"
   PassengerAppType node
   PassengerStartupFile src/server.js
   PassengerNodejs "/home/mjgykn3s9utp/nodejs/bin/node"
   PassengerAppEnv production

   # Do not inherit the main site's WordPress rewrite rules from public_html/.htaccess
   <IfModule mod_rewrite.c>
   RewriteEngine Off
   </IfModule>
   ```
5. **Cron** (`crontab -e`):
   ```
   */15 * * * * cd /home/mjgykn3s9utp/megainfomatix/python && venv/bin/python src/main.py monitor --once >> /home/mjgykn3s9utp/megainfomatix/logs/monitor.log 2>&1
   ```
6. **DNS** (GoDaddy → megainfomatix.com → DNS):

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `184.168.114.12` |
   | CNAME | `www` | `@` |

7. **SSL**: cPanel → SSL/TLS Status → tick megainfomatix.com + www → **Run AutoSSL** (after DNS points to the server).

## Checking it works

| Address | Expected |
|---|---|
| https://megainfomatix.com | "Coming soon" page; System status shows API, Database and Python analytics as **Connected** |
| https://www.megainfomatix.com | Redirects to https://megainfomatix.com |
| https://megainfomatix.com/api/health | `"status":"ok","database":"ok","python":"ok"` |

## Troubleshooting

| Problem | Where to look |
|---|---|
| "We're sorry, but something went wrong" / blank page | `~/megainfomatix/server/stderr.log` (Passenger), or run `cd ~/megainfomatix/server && ~/nodejs/bin/node src/server.js` over SSH to see the error |
| `python: "unreachable"` in health | `cd ~/megainfomatix/python && venv/bin/python src/main.py query health` |
| Monitoring not running | `crontab -l` and `tail ~/megainfomatix/logs/monitor.log` |
| Restart the app manually | `touch ~/megainfomatix/server/tmp/restart.txt` |
| "Not secure" warning | Run AutoSSL (step 7) and wait ~10 minutes |
