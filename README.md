# Koloss Media

Static HTML, CSS, and JavaScript. No install or build step is required.

Run `python3 -m http.server 8765 --bind 127.0.0.1` from the repository, then open `http://127.0.0.1:8765/`.

The homepage and consultation page have been replaced with a focused marketing site for business owners and personal brands. `/home/` redirects to the root homepage. Other files are retained from the WordPress archive and are not rewritten in this release.

See [the operating playbook](docs/business-improvements.md) for proposed package scope, pricing reconciliation, case-study evidence, and deployment handoff. Proposed scope requires owner approval before publication. The live site's $5,000 and $12,000 starting-price anchors are retained.

The consultation page generates a local brief, offers an email draft, and links to the existing Cal.com calendar. It does not submit leads to a CRM or change the calendar configuration.

The Vercel project `kolossmedia-com` deploys this repository’s `main` branch. `www.kolossmedia.com` serves production; `kolossmedia.com` redirects to it. The retained WordPress archive has legacy entry-point redirects documented below.

## Conversion improvements

The homepage includes mobile navigation, a goal-based package finder, and a scope comparison. The consultation page distinguishes service and media budgets, rejects blank goals, refreshes changed briefs, and downloads notes. Local browser event hooks are documented in [the acquisition plan](docs/acquisition-plan.md); they do not transmit data or configure analytics.

The Vercel Git integration successfully built a PR preview from this repository. The production domain mapping was verified on October 14, 2026. Future changes to pricing or promised package scope require owner approval. Internal pipeline/workbench tools are delivered separately and are not served by this repository.

## Legacy links and search metadata

The Vercel configuration redirects the archived catalog, product, cart, checkout, account, and case-study entry points into the current site. The partnership page now explains introductions and uses the existing business email without promising unconfirmed commission terms. Current entry points have canonical metadata and a sitemap. See [the route migration](docs/legacy-route-migration.md) for destinations and verification. Archive files and the existing terms-and-conditions page are preserved.

## Inquiry sources

Supported campaign tags follow internal links into the consultation brief without cookies, local storage, or network reporting. Visitors can correct the optional source answer. The brief separately records link tags, which indicate the link used, not verified causation. Email drafts require the visitor to review and send in their email app. See [inquiry measurement](docs/inquiry-measurement.md) for the supported labels and reconciliation steps.

## Shorter consultation path

The calendar and email links are available before the optional brief. The brief initially asks for audience, service interest, and goal; links, budgets, timing, and source remain in a native disclosure. Validation opens the disclosure when an optional answer needs correction. No booking or lead submission happens automatically.

## Content production

`/content/` gives the existing Custom content service a focused landing page with portfolio examples, audience-specific consultation links, scope questions, and canonical/social metadata. The homepage links to it and the sitemap includes it. Audience query preselection accepts only `business`, `brand`, or `both`. Deliverable quantities, fees, and dates remain scoped in the proposal.
