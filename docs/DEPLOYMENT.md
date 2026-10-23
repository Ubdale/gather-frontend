# Deploying Gather

## Two repositories

Clone gather-frontend and gather-backend next to each other. Use Node 24 for both. Each repository has its own lockfile and GitHub Actions checks.

## Development

Backend: `npm ci`, copy `.env.example` to `.env`, `npm run build`, `npm start`.
Frontend: `npm ci`, `npm start`.

Open http://127.0.0.1:4200. Create an account and workspace; no seeded credentials are shipped. Invite another address from Admin Studio and share its one-use link through your own trusted channel. Automatic email delivery is not configured or advertised.

## Container deployment

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
      DATABASE_PATH: /app/.data/gather.sqlite
      FRONTEND_URL: https://community.example.com
      TRUST_PROXY: 1
    volumes:
      - gather-data:/app/.data
    expose:
      - '3000'
  frontend:
    build: ./gather-frontend
    restart: unless-stopped
    ports:
      - '127.0.0.1:8080:80'
    depends_on:
      - backend
volumes:
  gather-data:
```

Replace the example hostname and terminate HTTPS at a trusted reverse proxy pointing to 127.0.0.1:8080. Set FRONTEND_URL to the exact public HTTPS origin, without a path. The NestJS API rejects state-changing requests from other origins. Do not enable permissive CORS or expose SQLite files via nginx. Secure session cookies require HTTPS in production.

TRUST_PROXY=1 is appropriate only when exactly one trusted HTTP proxy sits directly in front of the API. Adjust your architecture deliberately instead of trusting arbitrary client-supplied forwarding headers.

The Docker and nginx configuration is supplied as a deployment path. It must be validated in your target hosting environment; repository tests do not provision hosting or certificates.

## Health and monitoring

GET `/api/health` returns service readiness after the application and database initialize. Monitor it through your deployment system. The API applies body-size limits, security headers, authentication rate limits, and an overall request limit. Rate limits are local to the single API process; do not market this as a multi-region service.

## Backups

In the backend checkout/container, `npm run backup -- /private-backups/gather-YYYY-MM-DD.sqlite` creates a consistent backup using SQLite's backup API. The destination directory must exist and must not be under the public web root. Schedule encrypted off-host copies and test restoration.

To restore, stop the API, preserve the current database directory, and replace the configured SQLite database with a verified backup. Start the API and check sign-in, workspaces, posts, and message history. Do not copy an actively changing raw database without a SQLite-aware backup.

## Manual operations

- Plans: `npm run plan -- requests`; after arranging payment, `npm run plan -- activate REQUEST_ID --confirm-invoiced`; or `npm run plan -- decline REQUEST_ID`.
- Account recovery: verify the requester through your documented support process first. Then run `npm run account -- recovery user@example.com --identity-verified`. Share the emitted one-use 30-minute link privately. The user sets the new password; all prior sessions are revoked. Do not put recovery links in logs, tickets visible to other customers, or source control.
- Users can download their own authored data from Profile. Handle broader retention/deletion requests through a documented operator process for this initial release.

No database, session, invitation token, recovery link, real customer account, or `.env` file belongs in a Git repository.
