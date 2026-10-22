# SnapLink

Responsive static URL shortener front end with browser-generated QR codes.

## Files
- `index.html` — main shortener tool
- `about.html`, `contact.html`, `privacy.html`, `cookies.html`, `terms.html`, `disclaimer.html` — separate information pages
- `assets/css/styles.css` — shared styling refinements
- `assets/js/app.js` — main page interaction logic

## Before production
1. Replace `hello@example.com` in `contact.html` with the real site contact address.
2. Review all policy text against the actual hosting, analytics, advertising, and third-party service setup.
3. The shortener sends submitted URLs to `https://os8.me/`. Confirm its current API terms and privacy/security posture before relying on it.
4. Styling and QR code libraries are loaded from third-party CDNs. For stronger production security, compile/self-host assets and configure a restrictive Content Security Policy, HSTS (HTTPS only), `X-Content-Type-Options: nosniff`, and an appropriate `Permissions-Policy` at the hosting/server layer.
5. Static front-end changes do not provide server-side rate limiting, abuse detection, or protection for the third-party shortening provider.

Ad placeholder sections have been removed for now; no AdSense script is included.
