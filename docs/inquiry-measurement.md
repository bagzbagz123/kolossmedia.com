# Inquiry sources and follow-up

The live site can carry campaign context into a visitor’s consultation brief. It does not count visits, collect submissions, or connect to a CRM. The optional source answer can be corrected by the visitor. Link tags describe the link used; they do not prove which channel caused the inquiry.

## Make campaign links

Use the separate local campaign-link builder in the delivered operations folder. Choose a landing page and offer, source, medium, and a short campaign ID such as `content-oct26`. Never put a person's name, email, client information, or other private content into URL tags. All tags appear in a public URL.

Supported sources: `instagram`, `linkedin`, `youtube`, `google`, `email`, `referral`, `outreach`.
Supported media: `organic`, `social`, `paid_social`, `cpc`, `email`, `referral`, `outbound`.
Campaign IDs: up to 64 lowercase letters/numbers, with internal hyphens or underscores. A recognized source is required; unsupported values are ignored. Other query parameters are not propagated. Campaign context is kept only in the current URL and internal links. It is not saved to browser storage and is not appended to Cal.com or mailto destination addresses.

Visitors can prepare a brief and choose to copy, download, open an email draft, or go to the existing calendar. The email draft includes the visible brief, including any source tags; sending requires the visitor to review and send it in their email app. If a mail app does not open, the copy option remains available.

## Record real inquiries

When an actual email or confirmed booking arrives:

1. Add one record to the local pipeline, merging duplicate email/booking inquiries from the same prospect.
2. Select the broad source: referral, website, outreach, content/social, or other. Record the link source, medium, and campaign ID in Notes when available. If absent, record “unknown”; do not infer a campaign.
3. Assign an owner and one dated next action. Suggested operating target: first response by the next business day, adjusted for team capacity. This is an internal target, not a published promise.
4. Move to Call booked only after a calendar confirmation. An open calendar or prepared brief is not a booking. Move to Paid only after an actual initial payment is collected.
5. Save and export the local pipeline; it is not a shared or automatic CRM.

## Weekly review

Use the same date range and campaign cohort for outreach, replies, inquiries, confirmed bookings, attended calls, proposals, and initial payments. Compare the recorded acquisition spend with actual collected initial payments; review delivery costs separately in the economics workbench. Preserve unknown sources and lost reasons instead of filling gaps with guesses. The site cannot provide a visit-to-inquiry rate until a verified analytics implementation provides the visit denominator.

## Analytics status

`koloss:conversion` currently emits local events for consultation clicks, package-finder use, brief preparation, calendar opens, and email draft opens. Payloads contain only event names and offer IDs. No free-text answers or campaign values are sent in those events. No analytics provider is installed or reporting. Email draft opens are not emails sent; calendar opens are not confirmed bookings.

Vercel analytics was reviewed as an option. Its dashboard activation, data handling, and any usage charges require a separate decision before installation. Current documentation: https://vercel.com/docs/analytics/quickstart and https://vercel.com/docs/analytics/limits-and-pricing .
