# Legacy entry-point cleanup

The repository retains the original static archive, but the current marketing site should present one offer and consultation flow. Before this release, the public legacy catalog, product pages, cart, checkout, account, case-study, and partner pages were still reachable. The catalog included older follower guarantees and different price copy; the partner page advertised unconfirmed commission terms.

## Routing

`vercel.json` applies temporary (307) redirects before the legacy files are served. Each entry point has explicit rules for the bare path, trailing-slash directory root, and wildcard subpaths. These redirects can be changed in a later deployment without leaving a permanently cached route on visitors' devices.

| Legacy entry point | Current destination |
|---|---|
| `/services/*`, `/growth/*`, `/social-growth/*` | Homepage package section |
| `/service/*`, `/web-development/*` | Custom consultation |
| `/cart/*`, `/checkout/*`, `/my-account/*` | Consultation page |
| `/case-studies/*` | Current creative-work section |
| `/partners/*` | Current partnership information |
| `/home/*`, `/feed/*` | Current homepage |

The `section` query accepts only a short list of existing homepage section IDs and scrolls to that section after the document loads. Other query parameters are not executed as cart or account actions. The existing active `/book-a-call/` path is preserved.

## Partnership page

The new partnership page gives clients an email contact, suitable introduction context, and a path to a consultation. It does not promise a commission amount, payout schedule, application acceptance, or income. Any commercial arrangement is confirmed with the team in writing.

## Search metadata

The current homepage, consultation page, and partnership page use canonical URLs on `www.kolossmedia.com`. The homepage has a social preview title, description, and existing brand image. The sitemap lists the three current entry points. `robots.txt` references it and discourages indexing archive metadata paths. No Search Console submission or ranking result is claimed.

## Preserved material

Original archive files and media remain in Git; the redirect rules retire the specified public entry points. The terms-and-conditions page is unchanged. Existing package price anchors, Cal.com destination, and consultation logic remain in place. No client messages or referrals have been sent.

## Verification

Check direct directory paths, nested `index.html` paths, an old add-to-cart filename, and a URL carrying campaign parameters on the deployed preview. Confirm each reaches the intended current page without a redirect loop. Confirm the active homepage, assets, partnership, and consultation paths remain HTTP 200. Repeat representative checks on production after release.
