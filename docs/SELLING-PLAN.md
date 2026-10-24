# Gather: paid-pilot sales plan

## Decision

Worth a limited validation effort; not yet proven worth a large investment. The product works as a private community pilot, but a feed, direct chat and a voice recorder do not by themselves establish customer demand. Existing competitors have broader feature sets. Start with one customer segment and sell assisted setup and ongoing service. Keep the source code and defer a separate recorder-library business until this offer has paying users.

Initial segment hypothesis: independent coaches and small training providers with an existing member group. Qualify buyers who regularly lose announcements or discussions in chat and will actively invite their members. Do not target regulated medical/financial use, large enterprises, children-focused communities, or customers requiring live calls, native apps, courses, payments, SSO or guaranteed uptime in this release.

## Offer and scope

“A private home for your member community: organized discussions, private text and voice messages, and an admin panel. We help you set up your spaces, branding and member invitations.”

Delivered today: workspace isolation, roles and suspension, posts/comments/reactions/saved items, text and voice messaging, search, moderation, workspace name/color branding, personal export, operator recovery, manual plan requests, and PostgreSQL backups. Messaging polls every four seconds; do not advertise instant realtime chat or end-to-end encryption. Branding means in-app name, tagline and accent; custom domains and fully white-labelled applications are separate work.

Test the existing $49/month Starter offer (100 members, 10 active spaces, 256 MB voice storage) and $149/month Growth offer (500 members, 50 spaces, 1 GB voice storage). Pilot: 10 members, 3 spaces, 50 MB voice storage. All recordings are capped at 180 seconds / 2 MB. Setup assistance can be quoted at $149 once; this is a pricing hypothesis, not validated demand or an implemented checkout. Paid activation remains manual after a separately agreed invoice. Define cancellation and renewal handling before accepting money; the app does not charge a card.

## Thirty-day validation

1. Days 1–7: interview 10 qualified prospects. Ask how they run the current group, the last information they lost, what it cost them, who decides on tools, and why they would switch. Do not pitch over a problem that does not exist.
2. Days 8–14: run 5 tailored demos. Offer a 14-day assisted pilot to 3 prospects who agree to invite real members. Keep each customer's workspace separate.
3. Days 15–28: onboard and check progress twice weekly. Record invitations accepted, members posting/replying, recurring friction, support time and the customer's willingness to pay. These are operator measurements; no analytics dashboard is claimed.
4. By day 30: seek 3 actual paid conversions. A positive signal is at least 2 of 3 pilots using the community weekly and 3 buyers paying the tested price. An interview compliment, a signup or a free pilot alone is not validation.

If 20 qualified conversations produce no paid commitments, revise the customer segment or problem before adding features. If buyers repeatedly require courses, live calls or mobile apps, decide whether that is a focused opportunity or a reason to sell implementation services instead. Do not build all of them speculatively.

## Acquisition and demo

Begin with the owner's existing network, coach/trainer communities, and agency relationships. Research prospects individually and request short conversations. No unsolicited outreach has been sent by this project. Avoid paid ads until the first customers convert and retain.

Draft outreach for owner review:

> Hi [Name], how do you currently organize member announcements and discussions? I’m building a private community service for small training businesses, with organized posts, private chat and voice messages. If keeping conversations organized is a problem for your group, would a 10-minute demo be useful?

Five-minute demo: show the prospect's example community name → post an announcement in a space → member comment/reaction → text/voice conversation → invite and role controls → explain pricing, limits, support and manual billing. Use fictional demo data; never expose another customer's workspace. Lead with the buyer's observed problem, not the tech stack.

## Economics and spending gates

Three Starter customers represent $147/month in subscription revenue before costs, tax, support time and churn. Ten represent $490/month; neither is profit. Include compute, database/backup usage, transfer, payment processing, domains and support labor when calculating margins. Keep a weekly record of hours spent per customer; unbounded customization can make a small subscription uneconomic.

Before validating demand, cap new feature work at a suggested 20–30 hours and keep cash spending limited to reliable, commercially permitted hosting and necessary operations. Do not buy advertising, an expensive domain or build native apps yet. Raise the budget only after paid use and retention justify it. Vercel's Hobby plan is restricted to personal/non-commercial use; confirm the hosting plan before commercial operation. Paid upgrades and purchases require the owner's decision.

## Customer onboarding and handover

Owner reviews scope and subscription terms → agree invoice and support contact → create a dedicated workspace → set name/tagline/accent → create spaces → invite the intended members privately → verify owner/member permissions → perform the first post, reply and conversation together → confirm backup/restore and recovery procedures → review pilot engagement → arrange payment separately → operator activates the requested plan → document renewal and cancellation dates.

Business name, domain and support email are intentionally deferred at the owner's request. Before charging, the owner must supply the support contact, customer terms/privacy information, retention/deletion process and invoice details. Do not publish placeholders as real policies, customer testimonials, security certification or an SLA. Physical mobile-device/real microphone checks and a customer-specific acceptance demo remain launch gates until recorded as complete.

## References checked 24 October 2026

- Competition: https://circle.so/pricing
- Vercel commercial-use plan restriction: https://vercel.com/docs/plans/hobby
- Infrastructure pricing to recheck before purchase: https://vercel.com/pricing and https://render.com/pricing
