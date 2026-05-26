
# Plan: Installable Web App (PWA) with one-time install modal

Make Webtuto installable to the home screen on Android & iPhone, with a friendly centered modal that only ever shows once per user.

## Approach: manifest-only PWA (no service worker)

Per Lovable PWA guidance, full PWA + service workers can break the editor preview and add cache/offline complexity you don't need just for installability. We'll go **manifest-only**: enough for "Add to Home Screen" / Chrome's native install prompt, without service-worker pitfalls.

## What gets built

### 1. Web app manifest (`public/manifest.webmanifest`)
- `name`: "Webtuto — Sri Lanka's #1 Online Learning Platform"
- `short_name`: "Webtuto"
- `display: standalone`, `theme_color`, `background_color` matching dark theme
- `start_url: "/"`, `scope: "/"`
- Icons: 192x192 and 512x512 (generated from existing logo)
- Apple touch icon for iOS

### 2. `index.html` head additions
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<link rel="apple-touch-icon">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="theme-color" content="...">`

### 3. Install modal component (`src/components/InstallAppModal.tsx`)
- Centered shadcn `Dialog` with:
  - App icon (logo) + tagline "Get the Webtuto app"
  - 3 benefit bullets (fast access, full-screen, push-ready)
  - **Android/Chrome**: "Install" button that fires the captured `beforeinstallprompt` event
  - **iOS Safari**: shows step-by-step instructions ("Tap Share → Add to Home Screen") since iOS has no programmatic install
  - "Maybe later" button
- Listens for `beforeinstallprompt` (captured globally) and `appinstalled`
- Hidden in:
  - Lovable preview hosts / iframes (so it doesn't bother you in the editor)
  - Already-installed mode (`display-mode: standalone`)
  - Any user who already saw it (localStorage flag `wt_install_prompt_seen`)

### 4. Show-once logic
- localStorage key `wt_install_prompt_seen` — set the moment the modal opens, regardless of outcome (install / dismiss / close).
- Trigger conditions ALL must be true:
  1. Not already installed
  2. Not on Lovable preview / not in iframe
  3. localStorage flag not set
  4. Either: `beforeinstallprompt` fired (Android/Chrome), OR user is on iOS Safari (we know there'll never be an event there)
- Delay: appears 8 seconds after first page load so it doesn't slap the user on arrival.
- Mounted once in `Layout` so it works on every public route.

### 5. Optional: manual re-trigger
- Tiny "Install app" link in the footer for users who dismissed it and changed their mind (re-uses the same modal, ignores the seen flag when triggered manually).

## What we explicitly will NOT do
- No `vite-plugin-pwa`
- No service worker / offline cache
- No background sync
- No push notifications (out of scope for installability)

## Trade-offs (honest)
- No offline support. Users still need internet to load lessons (which is true today anyway).
- Push notifications require a real service worker — not included. If you want them later, that's a separate plan.
- The install banner only shows on browsers that meet Chrome's installability heuristics (HTTPS published site, valid manifest, user has visited before). It will NOT show in the Lovable preview — that's expected.

## Files touched / created
- `public/manifest.webmanifest` (new)
- `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (generated)
- `index.html` (head tags)
- `src/components/InstallAppModal.tsx` (new)
- `src/components/Layout.tsx` (mount modal)
- `src/components/Footer.tsx` or equivalent (small "Install app" link — optional)

Approve and I'll build it.
