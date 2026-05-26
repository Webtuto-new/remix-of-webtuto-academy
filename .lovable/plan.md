## Goal

Transform the existing Webtuto.LK platform into a cinematic, premium learning ecosystem (Netflix + Udemy + Linear feel) without touching any backend, data, routing, auth, RLS, edge functions, or schema.

This is too large for a single pass. Foundations from Phase 1 are already live (dark-first tokens, glass, gradient mesh, Framer Motion page transitions, animated hero, modern card). The plan below redesigns every remaining surface in focused phases so each can be reviewed before moving on.

## Non-negotiable preservation

No changes to: database schema, RLS policies, edge functions, auth flow, routes, permissions, enrollment/access logic, payment workflow, syllabus hierarchy, recordings, lessons, students, tutors, admin data, WhatsApp automation, storage buckets. Only `.tsx`, `.css`, and `tailwind.config.ts` files are edited.

## Phase A — Public marketing & discovery surfaces

1. Homepage v2: cinematic hero with animated gradient mesh + subtle parallax, "Continue Learning" rail for logged-in users (pulls existing enrollments), Featured Classes rail, Live Now strip, syllabus showcase, testimonials from existing reviews, stats, premium CTA.
2. Curriculum / Grades / Subjects pages: glass cards with gradient borders, hover lift, animated grade selector, sticky filter chips on mobile.
3. Classes / Recordings / Bundles / Seminars / Workshops listing pages: filter sidebar collapsible on mobile, skeleton grids while loading, motion stagger on card reveal, empty states with illustration.
4. Class detail + Recording detail public pages: cinematic header with thumbnail backdrop blur, sticky purchase/enroll panel on desktop, mobile bottom sheet.
5. Auth pages (Login / Signup / Forgot / Reset): split-screen with gradient artwork, glass form card, motion entry.
6. Contact / How-to-use / Tutor application / Request class: editorial layout, larger type, glass forms.

## Phase B — Student experience

1. Dashboard shell: app-like sidebar with active glow, top bar with greeting + quick search, mobile bottom tab nav.
2. Overview: Continue Learning carousel, upcoming live class countdowns, recent lessons, watch history, achievements/certificates strip, notification feed.
3. Classes / Recordings / Schedule / Wishlist / Notes / Certificates / Payments / Requests / History / Profile: redesigned with consistent card system, charts where relevant, premium empty states.
4. Recording player page: Netflix-style layout — large player, chapter sidebar (sticky desktop, drawer mobile), next-lesson auto-advance UI (using existing localStorage resume), bookmarks list, lesson notes panel, materials tab.
5. PhonePrompt modal: cinematic blocking modal redesign.

## Phase C — Teacher experience

1. Teacher layout: same sidebar system in teacher accent.
2. Dashboard, Classes, Sessions, Students, Recordings, Earnings: chart cards, modern tables (zebra-free, glass rows, sticky headers, mobile card view).
3. Public teacher profile page: shareable hero with avatar ring-glow, stats, courses taught grid, reviews, share buttons.

## Phase D — Admin experience

1. Admin layout: collapsible glass sidebar, command-palette-style search shortcut, quick action header.
2. Admin Dashboard: KPI cards with sparklines, recent activity feed, quick actions.
3. All admin tables (Classes, Students, Teachers, Applications, Class Requests, WhatsApp, Recordings, Curriculum, Bundles, Payments, Bank Details, Payouts, Certificates, Coupons, Announcements, Analytics, Admins): unified modern DataTable component with filters, search, pagination, row hover, mobile card fallback. Existing dialogs restyled.
4. WhatsApp Messages + Automation pages: keep all existing controls (Preview, Copy, Open WhatsApp, Mark as Sent, Send Test) — only restyle.

## Phase E — Cross-cutting polish

1. Component library upgrades: Button variants (premium, glow, ghost-glass), Input/Textarea (floating label, focus ring-glow), Dialog (glass + spring motion), Sheet (mobile drawer), Tabs (pill underline glow), Badge (live pulse, status), Tooltip, Toast.
2. Skeletons for every list/grid (extend `SkeletonCard`, add `SkeletonRow`, `SkeletonStat`).
3. Page transitions already in `Layout`; add same wrapper to Dashboard/Admin/Teacher layouts.
4. SEO heads audited per page (titles <60, descriptions <160, H1 unique, JSON-LD where useful).
5. Mobile pass: 360–414px viewport audit on every redesigned page, touch targets ≥44px, sticky CTAs, safe-area padding.
6. Performance: `loading="lazy"` on non-hero images, `content-visibility: auto` on long lists, code-split heavy admin routes, drop unused shadcn imports.

## Technical details

- Stack stays: React 18 + Vite + Tailwind v3 + shadcn + Framer Motion (just added) + next-themes (already dark-default after Phase 1).
- All colors continue to use semantic tokens in `src/index.css` (HSL). No hard-coded hex/Tailwind color classes in components.
- New shared primitives go under `src/components/ui/` (extend existing shadcn) or `src/components/premium/` for higher-level patterns (HeroBackdrop, GlassPanel, StatCard, DataTable, EmptyState, SectionHeader, Carousel).
- Framer Motion: shared variants in `src/lib/motion.ts` (fadeUp, stagger, springSoft) to keep timings consistent.
- Typography: keep mandated Space Grotesk + Plus Jakarta Sans (project memory rule) — do not switch to Inter/Satoshi/Poppins despite the brief, because project memory locks the pair. Will confirm with user before deviating.
- No new dependencies unless strictly needed (chart upgrades reuse existing `recharts`).
- Each phase ships as one batch of edits and waits for review before the next.

## What I need from you

1. Confirm I should keep Space Grotesk + Plus Jakarta Sans (current locked pair), or override to Inter/Satoshi/Poppins.
2. Confirm we start with Phase A (public/marketing + auth) and proceed phase-by-phase, OR pick a different starting phase (e.g. start with the Recording player since that's where students spend most time).

I'll begin implementing the chosen phase immediately after you reply.
