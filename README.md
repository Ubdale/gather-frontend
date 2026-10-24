# Gather frontend

A private community product with a social feed, direct messaging, and an admin studio. This repository is the Angular client; persistent data and permissions live in the separate NestJS API.

Production frontend: https://gather-community.pages.dev (Cloudflare Pages). The API remains on Render and is reached through the frontend's same-origin `/api` proxy.

## Local development

Use Node.js 24.15 or newer on the Node 24 line.

1. Clone https://github.com/Ubdale/gather-backend into a separate directory, run `npm ci`, copy `.env.example` to `.env`, and set the backend-only PostgreSQL `DATABASE_URL`. Run `npm run build`, then `npm start` there. The API listens on 127.0.0.1:3000.
2. In this frontend repository, run `npm ci` and `npm start`.
3. Open http://127.0.0.1:4200 and create your own free pilot workspace. There are no default accounts or passwords.

The Angular development server proxies `/api` to the backend. Production must also serve the app and `/api` from the same origin; do not expose the API database or use a public frontend environment file for secrets.

## Implemented product workflows

- Public product website, actual plan limits/prices loaded from the API, signup and sign-in.
- Separate workspaces, active workspace switching, hashed passwords, HttpOnly cookie sessions, sign-out and password changes.
- Private invitation links restricted to the invited email; create or join using an existing account; expiring, one-use invitations and revocation.
- Spaces, archived spaces, post creation/editing/deletion, search, cursor pagination, comments with earlier-comment loading, reactions and saved posts.
- Direct messages between active workspace members, persistent message history, earlier-message loading, unread counts, starred threads, search, and mobile thread navigation. New messages are polled every four seconds while the messaging screen is open.
- Members, real role/status changes, protected ownership, moderation reports, hide/restore, branding, and an administrative audit trail.
- Profile changes, personal-data download, and one-use operator-issued password recovery links.
- Plan change requests with an explicit manual invoice process; limits are enforced by the server. There is no misleading checkout or automatic charge.

Gather supports text and private voice messages with a custom waveform recorder, pause/resume, preview, seeking, and playback speed. Recordings are limited to 3 minutes and 2 MB each. Voice storage allowances are 50 MB for Pilot, 256 MB for Starter, and 1 GB for Growth. Video/file uploads, live calls, native mobile apps, and automatic invitation/recovery email are outside the current scope.

## Routes

`/` product and pricing; `/register`, `/login`, `/join?token=...`, `/recover?token=...`; `/gather/feed`, `/gather/messages`, `/gather/saved`, `/gather/profile`, `/gather/admin`.

## Verification

- `npm run build` — production browser bundle in `dist/browser`.
- `npm run test:ci` — browser tests for the shell, API error handling, stale-response protection, and duplicate-action protection. Chrome must be installed.
- The backend repository has multi-user HTTP integration tests for the product and authorization boundaries.

## Deployment

The included Dockerfile builds the static app and serves it through nginx. The nginx config forwards `/api` to a container named `backend` on port 3000. See `docs/DEPLOYMENT.md` for the two-repository deployment procedure and operator setup. HTTPS termination is required for production session cookies.

Cloudflare Pages: `npm run build:cloudflare` prepares `dist/browser`, including the API Worker. The production Pages project is `gather-community`, connected to `Ubdale/gather-frontend` on branch `main`. Git pushes to `main` automatically build and deploy with Node `24.21.0`, build command `npm run build:cloudflare`, and output `dist/browser`. `npm run test:cloudflare` checks cookie/body/range forwarding and API failure handling. Database credentials belong only in Render's backend environment.

See `docs/PRODUCT-PLAN.md` for pricing assumptions, the initial customer segment, and the paid-pilot launch model. Deploying infrastructure or acquiring customers is separate from publishing these repositories.
