# Gather commercial model

## The first customer

Start with small agencies and membership-led businesses that want a private, branded home for their customers. Sell a managed community workspace combining announcements, member discussion, and direct messaging. Keep the first offer narrow: a browser-based, text-first community.

## Subscription offer

These are proposed Gather prices to validate with paid pilot customers, not established market-demand claims.

| Plan | USD / workspace / month | Member seats | Active spaces |
| --- | ---: | ---: | ---: |
| Pilot | 0 | 10 | 3 |
| Starter | 49 | 100 | 10 |
| Growth | 149 | 500 | 50 |

All current plans include the feed, comments, saved posts, private messages, roles, moderation, branding, and administrative history. Suspended memberships still occupy a seat. Archived spaces do not count toward the active-space quota. A user can own at most five workspaces in this release.

Offer optional onboarding, brand setup, and migration as a separately agreed service. A suggested starting hypothesis is a USD 299 onboarding fee; validate it before advertising a fixed package. Quote agency arrangements individually rather than promising unlimited usage.

## Billing that actually works in this release

1. A workspace owner submits a Starter or Growth request in Admin Studio → Plans. The API records it; the current plan stays unchanged.
2. The service operator lists pending requests using `npm run plan -- requests` in the backend repository.
3. The operator discusses the customer's needs and issues an invoice through their chosen external billing process.
4. After verifying the agreed payment, the operator activates the recorded request with `npm run plan -- activate REQUEST_ID --confirm-invoiced`.
5. The API enforces the updated seat and active-space limits. The activation is recorded in the workspace history. Requests can also be declined.

Gather does not process payments, store card details, issue invoices, or automatically renew or cancel subscriptions. Renewal reminders, dunning, and cancellation requests are operator-managed for the initial paid pilots. Do not describe the UI as an integrated payment gateway.

## Acquire the first customers

- Prepare a short demo showing owner signup → invitation acceptance → a community post → a private reply → moderation.
- Select one niche, interview 5–10 relevant prospects, and identify the communication problem they would pay to solve.
- Offer 2–3 paid pilot workspaces with clear member limits, onboarding support, and a feedback schedule.
- Measure activated members, weekly contributors, response times, retention, support time, and hosting cost before scaling marketing spend.
- Publish only customer-approved testimonials. Track actual paid commitments rather than treating free registrations as sales.

This document is a launch plan; no outreach, customer sales, payment collection, or public hosting deployment has been performed by the code changes.

## Launch scope and operating limits

This release uses NestJS with shared PostgreSQL storage, including private voice recordings. Neon is supported through a bounded pool with verified TLS. Multi-step mutations use transaction-scoped clients and a schema-scoped advisory write lock. This suits a controlled paid pilot; partition write locking, centralize rate limits and validate deployment capacity before high-throughput scaling. Database credentials stay in the backend environment.

Before public onboarding, configure the production domain/HTTPS, operator support contact, backup schedule, restore procedure, retention/deletion procedure, service terms and privacy information, and an external invoice process. Verify backups and restrict database/operator access. There is no end-to-end encryption claim: authorized participants access messages through the API, and the service operator controls database storage.

The proposed subscription category has existing commercial examples: https://circle.so/pricing and https://slack.com/pricing . Gather's prices above are independent hypotheses.
