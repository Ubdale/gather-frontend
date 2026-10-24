# Gather QC — 24 October 2026

## Scope and result

The implemented private-community workflows were reviewed against the production deployment and an isolated browser QC environment backed by a temporary PostgreSQL schema. Customer data was not used for write tests. Current automated results: **18 frontend browser tests passed; 26 backend checks passed**. Production Angular builds passed. These are reproducible regression and workflow checks, not a claim that all possible defects or all devices have been certified.

## Defects corrected

| Finding | Correction and evidence |
|---|---|
| Workspace logo appeared to log users out | It linked to the public homepage, whose header always showed Sign in. Workspace logos now open `/gather/feed`; public pages restore identity and offer Open your workspace. Router regression checks confirm no logout request and identity preservation. |
| Login page shown to already authenticated users | Session restoration redirects to the feed, while invitation flows remain accessible. Regression covered. |
| Old workspace response could replace a newly selected workspace | Request sequencing rejects late results/errors; private workspace UI state is cleared before switching. Regression covered. |
| Earlier-message response could append into a different thread | Conversation/workspace/cursor are captured and stale responses ignored. Regression covered. |
| Sending a message could erase a newly typed draft | Clear the draft only when it still matches the message that was sent; preserve a newer draft. Regression covered. |
| Expired sessions could leave stale private views visible | Failed protected requests clear private view state and navigate to sign-in. Regression covered. |
| A failed standalone sign-in attempt cleared cached identity | Authentication-form failures no longer imply that an existing session has expired. Regression covered. |
| Oversized PostgreSQL IDs could reach SQL and fail with 500 | IDs are validated against the database's integer range before SQL. Invalid IDs and malformed audio ranges are checked. |
| Pending requests/recorder callbacks could produce confusing state | Requests have a bounded timeout, recovery prevents duplicate submission, and stale recorder errors cannot reset a newer recording. Existing recorder cleanup tests retained. |

## Automated coverage

Frontend: application shell; same-origin API credentials and failures; session-expiry behavior; signed-in logo/home/login routing; stale feed responses; duplicate mutations; workspace switching; conversation pagination; message drafts; recorder permission denial, pause/resume, preview, send and resource cleanup using simulated recording APIs.

Backend: request origins and sessions; registration/invitation flows; workspace isolation; owner/admin/moderator/member permissions; posts, edits, deletion, comments, reactions, bookmarks and search; private text and voice messages; authenticated audio bytes/ranges/limits; suspension; quotas; moderation; billing request boundaries; branding and audit; password changes/recovery and export; persistence across pool reopen; concurrent registration; parameter binding, transaction isolation/rollback; operator backup/restore including refusal to overwrite populated data.

## Browser walkthrough

Production baseline: homepage, API health and plans, direct routes, pilot sign-in, refresh persistence, feed/history, voice playback, admin data, sign-out and anonymous protected-route rejection were verified. The original logo bug was reproduced in production before modification.

Updated production build in isolated QC: signed in as a synthetic owner; published a post; reacted, saved and commented; started a conversation and sent a message to a synthetic test member; clicked the logo from Messages and returned to the signed-in feed; switched to a separate workspace and verified the previous workspace's post was absent. No real customer messages or paid plan activations were used.

The synthetic member then signed in, received/read the message and cleared its unread count; Admin Studio navigation was absent. The deployed Vercel update was verified separately: the authenticated public homepage restored Open your workspace, and clicking the workspace logo from Messages returned to the signed-in feed. Both repositories' CI checks passed for the release commits.

## Release limits and launch gates

- Validate the deployed fix after Vercel/Render finish their deployments; a Git push alone is not live verification.
- Real microphone input and physical Safari/iOS/Android testing remain manual acceptance checks; simulated recorder tests do not certify hardware/browser compatibility.
- Validate hosting capacity, monitoring, backup retention and restore procedures in the actual customer deployment. No load/penetration-test certification or uptime SLA is claimed.
- Billing remains a manual invoice/activation process; there is no card checkout or automatic renewal. Calls, courses, native apps, SSO and end-to-end encryption are outside the implemented scope.
- Business name, domain and support email are deferred by the owner. Before taking payment, provide the support contact, customer terms/privacy information and cancellation/retention procedures, and confirm commercially permitted hosting.

The product is a candidate for supervised paid pilots once these launch gates are completed, not an enterprise-certified platform. See `SELLING-PLAN.md` for acquisition, onboarding, pricing experiments and investment gates.
