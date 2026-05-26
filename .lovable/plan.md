
# Plan: Make WebTuto the best student experience (with growth built-in)

Goal: combine marketing/growth surfaces with student-experience polish, so the site both attracts new students and keeps them engaged.

## 1. Hero & social proof on homepage
- Refresh hero with a strong promise + clear CTAs ("Browse Classes", "Meet Tutors").
- Add a **live stats strip**: active students, lessons available, tutor count, hours of content (pulled from DB).
- Add a **testimonials carousel** with student quotes (new `testimonials` table; admin-managed).
- Add **trust badges**: curriculum logos (Cambridge / Edexcel / Local), payment methods.

## 2. Student dashboard upgrades
- **Continue Watching** rail (uses existing localStorage resume state + recent lessons).
- **My Progress** per subject: % lessons watched, current chapter, next-up lesson.
- **Streak & achievements** (light gamification: 3-day, 7-day, 30-day streaks; first-lesson, first-class badges).
- **Recommended for you** rail: classes matching enrolled grade/curriculum that the student hasn't joined.

## 3. Discovery & search
- Global **search bar** in header: classes, tutors, lessons (debounced, grouped results).
- **Filter chips** on classes page: delivery mode (live / recorded / hybrid), price range, tutor.
- **"New this week"** and **"Popular"** sections on the classes page.

## 4. Growth loops
- **Referral program**: each student gets a referral code; referred signups grant both sides a discount credit (new `referrals` table, admin-tracked).
- **Free preview funnel**: ensure every class has at least one free preview lesson; CTA at end of preview prompts enrollment.
- **Email/WhatsApp digest**: weekly "new lessons added" notification (manual trigger from admin for now; later automated).
- **Share buttons** on class & tutor pages (WhatsApp, Facebook, copy link).

## 5. SEO & marketing surfaces
- Per-route meta (title, description, canonical, og:*) via `react-helmet-async` on:
  - Home, Classes index, Class detail, Tutors index, Tutor detail, Curriculum pages.
- JSON-LD: `Organization` sitewide, `Course` per class, `Person` per tutor, `BreadcrumbList` on detail pages.
- Public `/blog` section (admin-authored study tips, exam guides) — strong long-tail SEO.
- `sitemap.xml` auto-generated from active classes/tutors/blog posts.

## 6. Engagement touches
- **Notification bell** in student header (new lesson added, class starting soon, payment approved).
- **"Ask a doubt"** button on each lesson → opens WhatsApp with prefilled context.
- **Confetti + toast** on milestones (first lesson watched, class enrolled, streak hit).

## 7. Trust & polish
- **Help Center / FAQ** page (categorized: enrollment, payments, technical).
- **About** page with mission + team.
- Clearer **pricing transparency** on class cards (per-month + per-lesson breakdown).

---

## Technical notes
- New tables: `testimonials`, `referrals`, `notifications`, `blog_posts`, `student_streaks`, `achievements`, `student_achievements`. All with RLS + grants.
- Recommendation logic is client-side (filter active classes by enrollment.grade, exclude already-enrolled).
- Search is client-side over a cached list initially; move to RPC if dataset grows.
- Streaks computed from `student_events` (existing tracking table).
- Helmet provider added at `src/main.tsx`; sitemap as a build-time script.
- All UI uses existing dark theme + Space Grotesk / Plus Jakarta Sans tokens.

---

## Suggested rollout order (build in this sequence)
1. Homepage hero + testimonials + live stats (immediate marketing lift)
2. Per-route SEO meta + JSON-LD + sitemap
3. Student dashboard: Continue Watching + Recommended
4. Search + filters
5. Streaks & achievements
6. Referral program
7. Blog + Help Center
8. Notifications + share buttons

Pick a starting point (or a subset) and I'll build it.
