
# Master Quiz Center — Redesign Plan

Scope: Replace only the quiz module. Existing classes, recordings, payments, profiles, teachers, enrollments, curriculum, etc. are untouched.

## 1. Database changes (additive — no destructive drops)

Extend existing `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `quiz_attempt_answers`. Add new tables for live sessions and join control.

### `quizzes` — add columns
- `quiz_mode` text: `live` | `self_paced` | `published_grade` (default `self_paced`)
- `syllabus` text (Cambridge / Edexcel / National / Other)
- `chapter` text, `lesson` text
- `difficulty` text: `easy` | `medium` | `hard`
- `negative_marks_per_question` numeric default 0
- `shuffle_options` boolean default true
- `show_score_immediately` boolean default true
- `allow_review` boolean default true
- `show_leaderboard` boolean default true
- `available_from`, `available_until` timestamptz
- `require_password` boolean default false
- `join_code` text (6-char alphanumeric, indexed unique when not null)
- `status` text: `draft` | `published` | `archived`

### `quiz_questions` — add columns
- `negative_marks` numeric default 0
- `correct_answer_text` text (for short-answer auto-grading / explanation)

### `quiz_attempts` — add columns
- `attempt_number` int default 1
- `status` text: `in_progress` | `submitted` | `auto_submitted` | `disqualified`
- `live_session_id` uuid (nullable)
- `rank` int (computed at submit for live)

### New table: `quiz_live_sessions`
Tracks a single "broadcast" of a live quiz.
- `id`, `quiz_id`, `host_user_id`, `join_code`, `password_hash` (nullable), `status` (`waiting`|`active`|`paused`|`ended`), `current_question_id`, `current_question_started_at`, `started_at`, `ended_at`, `created_at`
- RLS: host (teacher/admin) full control; joined participants read; admins all.

### New table: `quiz_live_participants`
- `id`, `live_session_id`, `user_id`, `joined_at`, `left_at`, `status` (`waiting`|`active`|`left`)
- Unique (`live_session_id`, `user_id`).

### New table: `quiz_imports` (optional — for traceability of bulk pastes)
- `id`, `quiz_id`, `source` (`paste`|`pdf`|`csv`), `raw_text`, `parsed_count`, `created_by`, `created_at`.

All new tables: GRANT to `authenticated` and `service_role`, RLS enabled with policies matching existing tutor/admin/student pattern. Realtime publication enabled on `quiz_live_sessions` and `quiz_live_participants` for live updates.

## 2. Frontend architecture

New route tree under `/quizzes` (student) and `/admin/quiz-center` + `/teacher/quiz-center` (admin/tutor). Old `AdminQuizzes` page becomes a redirect to the new Quiz Center.

### Shared components (`src/components/quiz/`)
- `QuizCard`, `QuizModeBadge`, `DifficultyChip`, `LeaderboardList`, `QuestionRenderer`, `OptionGrid`, `Timer`, `QuizProgressBar`, `JoinCodeDisplay` (big screen-friendly), `ResultSummary`, `AnswerReview`, `BulkPasteImporter` (parses the spec'd block format), `QuestionEditor` (MCQ / TF / short-answer with image upload to `documents` bucket).

### Admin Quiz Center (`/admin/quiz-center`)
Tabs: Overview, Quizzes, Live Sessions, Results, Analytics.
- Overview: KPI tiles (total quizzes, live now, completion rate, avg score), charts (per-class avg, weak chapters).
- Quizzes table with filters (mode, status, grade, subject, tutor), actions: edit / duplicate / publish / unpublish / assign / delete.
- Quiz Builder modal/page: settings tab + questions tab (manual + bulk paste) + preview tab.
- Live Sessions: list of active broadcasts, host info, participant count, end-session control.
- Results: per-attempt list, export CSV, reset attempt, manual short-answer grading.
- Analytics: weak students, weak questions, weak chapters, completion rate, avg score per class.

### Tutor Quiz Center (`/teacher/quiz-center`)
Same builder, scoped to own teacher records (RLS-enforced). Tabs: My Quizzes, Live Console, Results.
- Live Console: start/pause/next/end controls, big join-code panel (copy/regenerate/show-hide), live participant list, per-question timer, mid-quiz leaderboard.

### Student quiz UX
- `/quizzes` — browse: Live Now, Available (self-paced + published grade), Completed. Filters by subject/grade/class/type.
- `/quizzes/join` — enter join code + password for live.
- `/quizzes/:id/take` — taker UI: timer, question, options, auto-submit, navigation if allowed.
- `/quizzes/:id/result/:attemptId` — score, percentage, rank, review with explanations.
- `/dashboard/quiz-history` — full history with filters (subject, grade, class, type, month, score) + search. Click row → detailed review.

## 3. Bulk paste importer

Client-side parser that handles the documented format:
```
Question text
A) ...
B) ...
C) ...
D) ...
Correct Answer: B
Explanation: ...
```
- Tolerant to `1.`/`A.`/`a)` variants, blank lines between questions.
- True/False detected when only two options or "True/False:" prefix.
- Short answer detected when no options block.
- Preview parsed questions before commit; user can edit inline, then bulk insert.
- Optional PDF import: extract text via `pdfjs-dist` then run through the same parser.

## 4. Live quiz realtime

Use Supabase Realtime channels on `quiz_live_sessions` and `quiz_live_participants`:
- Host updates `current_question_id` and `current_question_started_at` → all clients react.
- Participants insert a row on join, update status on leave.
- Answers still write to `quiz_attempt_answers`; ranks recomputed on each submit.
- Join code: 6-char base32, generated server-side via a SECURITY DEFINER function; password stored as bcrypt-style hash via a small edge function `quiz-join` that verifies and returns an attempt token.

## 5. Edge functions
- `quiz-join` — validates join code + password, creates `quiz_live_participants` + `quiz_attempts` row, returns attempt id.
- `quiz-submit` — finalizes an attempt, computes score + rank, marks status.
- `quiz-export` — streams CSV/PDF of results for a quiz (admin/tutor only).
- `quiz-bulk-parse` (optional) — server-side fallback parser for very large pastes.

All with CORS, zod validation, JWT validation in code.

## 6. Design system

Reuse existing premium tokens (Space Grotesk / Plus Jakarta Sans, glass cards, dark mode). New visual elements:
- Big `JoinCodeDisplay` — 96px monospace, copy/regenerate buttons, gradient ring.
- Live "now playing" question card with circular timer.
- Leaderboard with rank chips, avatar, animated reordering (framer-motion `layout`).
- Result page with radial score gauge + per-question breakdown strip.

## 7. Migration / safety
- New schema is purely additive. No existing data deleted.
- Old `/admin/quizzes` route redirects to `/admin/quiz-center`.
- Existing `quiz_attempts` keep working — new columns default safely.

## 8. Build order (suggested phases)

Given the size, I'd ship this in 4 phases so you can review each:

1. **Phase 1 — Schema + Quiz Builder + Bulk Paste + Self-Paced flow + Student take/result + Quiz History.** (Foundation everyone needs.)
2. **Phase 2 — Published Grade Quiz browsing, filters, admin analytics tiles, CSV export.**
3. **Phase 3 — Live Quiz: sessions table, realtime host console, join code/password, participant lobby, live leaderboard.**
4. **Phase 4 — PDF import, manual short-answer grading UI, weak-students/questions/chapters analytics, PDF result export.**

## Questions before I start

1. **Confirm phased build?** Or do you want me to attempt everything in one pass (much larger PR, slower to review, higher risk)?
2. **Live quiz realtime:** OK to use Supabase Realtime (works out-of-the-box, no extra service)? Alternative would be a polling fallback only.
3. **PDF import:** Add `pdfjs-dist` dependency for client-side PDF parsing? Skips a server roundtrip.
4. **Old quiz data:** Keep existing `quizzes` rows visible in the new Quiz Center (marked as legacy/self-paced), or hide until manually migrated?

Reply with answers (or just "go phase 1") and I'll start with the migration + builder.
