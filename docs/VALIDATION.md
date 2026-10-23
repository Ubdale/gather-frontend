# Validation record

Validated locally on 24 October 2026 with Node 24.21 and Chrome Headless 155.

- Angular 22 production build: passed (approximately 464 kB initial JavaScript/CSS/polyfills before transfer compression).
- Frontend browser unit tests: 6 passed.
- NestJS HTTP, security, persistence, concurrency, and operator-tool tests: 23 passed.
- Frontend and backend runtime dependency audits: 0 reported vulnerabilities at the time of the check. This is an advisory check, not a security guarantee.
- Git publication snapshots: checked for environment files, SQLite data, recovery artifacts, old API credentials, and legacy project history; these are excluded.

Browser walkthrough using local test accounts:

1. Created an owner account and a workspace through the UI.
2. Published a real server-stored post, added a comment, reacted, and saved it; the saved-post screen loaded the same data.
3. Created an invitation and registered its intended recipient through the one-use join link.
4. Verified the ordinary member did not receive Admin Studio navigation.
5. Created a private conversation as the invited member and sent a message.
6. Signed in as the owner, saw the unread conversation, and sent a reply.
7. Submitted a plan request and verified that it remained pending without changing the plan or charging the user.
8. Checked responsive navigation, messaging, and the admin plan form. Confirmed asynchronous data rendering after the Angular 22 upgrade.

The test database and local browser data are not committed. CI workflows reproduce builds and automated checks on each repository.

Docker is not installed on this workstation, so the supplied container/nginx deployment path has not been executed here. No public hosting, TLS certificate provisioning, payment collection, or customer outreach is implied by these checks. Validate deployment in the actual hosting environment before inviting paying customers.
