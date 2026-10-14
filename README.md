# Koloss Media

Static HTML, CSS, and JavaScript. No install or build step is required.

Run `python3 -m http.server 8765 --bind 127.0.0.1` from the repository, then open `http://127.0.0.1:8765/`.

The homepage and consultation page have been replaced with a focused marketing site for business owners and personal brands. `/home/` redirects to the root homepage. Other files are retained from the WordPress archive and are not rewritten in this release.

See [the operating playbook](docs/business-improvements.md) for proposed package scope, pricing reconciliation, case-study evidence, and deployment handoff. Proposed scope requires owner approval before publication. The live site's $5,000 and $12,000 starting-price anchors are retained.

The consultation page generates a local brief and links to the existing Cal.com calendar. It does not submit leads to a CRM or change the calendar configuration.

The supplied repository contains the older WordPress archive rather than the different site observed at kolossmedia.com. Confirm the hosting repository, branch, and output directory before replacing production. Review legacy pricing and checkout URLs as part of migration.

## Conversion improvements

The homepage includes mobile navigation, a goal-based package finder, and a scope comparison. The consultation page distinguishes service and media budgets, rejects blank goals, refreshes changed briefs, and downloads notes. Local browser event hooks are documented in [the acquisition plan](docs/acquisition-plan.md); they do not transmit data or configure analytics.

The Vercel Git integration successfully built a PR preview from this repository. Production-domain mapping and package scope still require review before release. Internal pipeline/workbench tools are delivered separately and are not served by this repository.
