# Deploying Gather

## Two repositories

Clone gather-frontend and gather-backend next to each other. Use Node 24 for both. Each repository has its own lockfile and GitHub Actions checks.

## Development

Backend: `npm ci`, copy `.env.example` to `.env`, set the PostgreSQL `DATABASE_URL`, then `npm run build`, `npm start`. Neon URLs belong only in this private backend environment. `DATABASE_SCHEMA=gather` isolates the application tables.
Frontend: `npm ci`, `npm start`.

Open http://127.0.0.1:4200. Create an account and workspace; no seeded credentials are shipped. Invite another address from Admin Studio and share its one-use link through your own trusted channel. Automatic email delivery is not configured or advertised.

## Container deployment

For Cloudflare Pages, run `npm ci --include=dev` and `npm run build:cloudflare`; deploy **only `dist/browser`**. This adds an advanced-mode `_worker.js` API proxy and `_routes.json`. The proxy forwards cookies, Origin, request bodies and audio Range requests to `https://gather-backend-t3g1.onrender.com`, with no API caching. Only `/api` routes invoke the Worker; Pages serves the static Angular app and its built-in SPA fallback handles deep links. No database credentials or frontend environment variables are required. `npm run test:cloudflare` verifies proxy behavior.

The initial Cloudflare deployment can use dashboard Direct Upload (ZIP contents must have `index.html`, `_worker.js` and `_routes.json` at the root). For later updates, build and upload the same bundle or use an authenticated `npx wrangler pages deploy dist/browser --project-name YOUR_PAGES_PROJECT --branch main`. A Direct Upload project does not automatically deploy Git pushes. Git integration requires explicitly granting the Cloudflare GitHub app access to this frontend repository and choosing a Git-integrated project. Its build command is `npm run build:cloudflare`, output `dist/browser`, Node version `24.21.0`.

After Cloudflare assigns the production `https://...pages.dev` URL, set Render's `FRONTEND_URL` to that exact origin and redeploy the backend. This controls write-request origin checks and invitation/recovery links. Arbitrary preview URLs are not allowed by default. Verify `/api/health`, login, a hard refresh on `/gather/feed`, and authenticated voice playback after switching. Keep the existing host until the new origin is verified.

Current production Pages project: `gather-community`, URL `https://gather-community.pages.dev`, connected to GitHub repository `Ubdale/gather-frontend`, production branch `main`. Pushes to `main` automatically build and deploy using `npm run build:cloudflare`, output `dist/browser`, and Node `24.21.0` from `.node-version`. Render's canonical `FRONTEND_URL` is `https://gather-community.pages.dev` (no trailing slash). The older `gather-frontend.pages.dev` Direct Upload project and Vercel deployment are retained as previous builds; use the new Git-connected URL for the application. Direct Upload projects cannot be converted to native Git integration, which is why a separate Pages project was created.

For Vercel, import `Ubdale/gather-frontend` on branch `main`, framework Angular, root directory unchanged, Node 24.x, build `npm run build`, install `npm ci --include=dev`, and output `dist/browser`. The committed `vercel.json` proxies `/api/*` to `https://gather-backend-t3g1.onrender.com/api/*` and serves Angular routes through `index.html`. No frontend environment variables are needed. After deployment, set Render's `FRONTEND_URL` to the exact production Vercel origin with no trailing slash and redeploy the backend. Use the production URL for sign-in; arbitrary preview domains are not in the backend origin allowlist.

For a Render Node web service, select `gather-backend`, branch `main`, use build command `npm ci --include=dev && npm run build`, start command `npm start`, and health path `/api/health`. Set `NODE_VERSION=24.21.0`, `NODE_ENV=production`, `HOST=0.0.0.0`, `DATABASE_URL` to the private Neon URL, `DATABASE_SCHEMA=gather`, `FRONTEND_URL` to the exact HTTPS Vercel origin and `TRUST_PROXY=1`. Render supplies `PORT`. Production builds explicitly include development dependencies because TypeScript is needed for compilation. The Vercel frontend must proxy `/api/*` to the Render API on the same browser origin; do not put database credentials into frontend settings.

From the directory containing both checkouts, create a compose.yaml similar to:

```yaml
services:
  backend:
    build: ./gather-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      DATABASE_SCHEMA: gather
      FRONTEND_URL: https://community.example.com
      TRUST_PROXY: 1
    expose:
      - '3000'
  frontend:
    build: ./gather-frontend
    restart: unless-stopped
    ports:
      - '127.0.0.1:8080:80'
    depends_on:
      - backend
```

Replace the example hostname and terminate HTTPS at a trusted reverse proxy pointing to 127.0.0.1:8080. Set FRONTEND_URL to the exact public HTTPS origin, without a path. The NestJS API rejects state-changing requests from other origins. Do not enable permissive CORS or expose database credentials through the frontend. Secure session cookies require HTTPS in production.

TRUST_PROXY=1 is appropriate only when exactly one trusted HTTP proxy sits directly in front of the API. Adjust your architecture deliberately instead of trusting arbitrary client-supplied forwarding headers.

The Docker and nginx configuration is supplied as a deployment path. It must be validated in your target hosting environment; repository tests do not provision hosting or certificates.

## Health and monitoring

GET `/api/health` returns service readiness after the application and database initialize. Monitor it through your deployment system. The API applies body-size limits, security headers, authentication rate limits, and an overall request limit. Rate limits are local to the single API process; do not market this as a multi-region service.

## Backups

In the backend checkout/container, `npm run backup -- /private-backups/gather-YYYY-MM-DD.json` creates a consistent PostgreSQL snapshot, including voice recordings. The destination directory must exist and must not be under the public web root. Schedule encrypted off-host copies and test restoration. The snapshot includes sensitive customer data and password hashes; it does not include database connection credentials.

To restore, stop writes, configure an empty PostgreSQL schema, and run `npm run restore -- /private-backups/gather-YYYY-MM-DD.json`. The tool refuses a populated destination. Verify sign-in, workspaces, posts, and voice history before pointing the service at the restored schema. Use provider recovery and native PostgreSQL backups for larger installations.

For an existing SQLite pilot, stop the old API, preserve its SQLite backup, and run `npm run import:sqlite -- /private-data/old-gather.sqlite` with the destination PostgreSQL URL configured. It imports all tables and voice bytes atomically, preserves IDs and timestamps, resets identity sequences, and leaves the SQLite source unchanged. The target Gather schema must be empty.

## Manual operations

- Plans: `npm run plan -- requests`; after arranging payment, `npm run plan -- activate REQUEST_ID --confirm-invoiced`; or `npm run plan -- decline REQUEST_ID`.
- Account recovery: verify the requester through your documented support process first. Then run `npm run account -- recovery user@example.com --identity-verified`. Share the emitted one-use 30-minute link privately. The user sets the new password; all prior sessions are revoked. Do not put recovery links in logs, tickets visible to other customers, or source control.
- Users can download their own authored data from Profile. Handle broader retention/deletion requests through a documented operator process for this initial release.

No database, session, invitation token, recovery link, real customer account, or `.env` file belongs in a Git repository.
