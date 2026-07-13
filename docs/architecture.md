# BitDesigners Africa — System Architecture (V1)

> Constraints: $0/month (all free tiers), 50–80 learners/cohort, 1–2 builders + Claude Code, 12 weeks.
> Data model is OS-ready: contributions, deliverables, and reputation are first-class entities from day one.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript | SSR for slow networks, full-stack |
| Styling | Tailwind CSS + shadcn/ui | Premium components fast, no bootcamp look |
| Database + Auth | Supabase (Postgres + email/password auth + RLS) | Free tier, row-level security, real-time |
| File storage | Cloudflare R2 | PDF/image uploads, free tier, no egress fees |
| Video | YouTube unlisted embeds | Free, adaptive bitrate, zero infra |
| Email | Resend | Transactional email, free tier (100/day) |
| Hosting | Vercel | Free tier, edge, integrates with Next.js |
| Content | MDX in repo | No CMS to build; admin edits via git |
| PWA | next-pwa / Serwist | App shell + reading material caching |

---

## 2. Data Model

### Entity-Relationship Overview

```
Cohort 1──* Enrollment *──1 User
User 1──* Submission *──1 Mission (Module)
Submission 1──* Review
User 1──1 Profile
Cohort 1──* Workshop
Cohort 1──* Announcement
Track 1──* Unit 1──* Module 1──* Lesson
Module ?──1 Mission (optional: deadline, review_type, rubric)
Invite 1──1 Track, 1──1 Cohort
```

### Schema

```sql
-- USERS & AUTH (Supabase auth handles email/password; this is the app profile)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('learner','mentor','admin','alumni')),
  full_name     TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  portfolio_url TEXT,
  track         TEXT CHECK (track IN ('design_lab','oss_lab')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- COHORTS
CREATE TABLE cohorts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  track         TEXT NOT NULL CHECK (track IN ('design_lab','oss_lab')),
  starts_at     DATE NOT NULL,
  ends_at       DATE,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ENROLLMENTS (user <-> cohort, many-to-many)
CREATE TABLE enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  role_in_cohort TEXT NOT NULL DEFAULT 'learner' CHECK (role_in_cohort IN ('learner','mentor')),
  enrolled_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cohort_id)
);

-- INVITES
CREATE TABLE invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  track         TEXT NOT NULL CHECK (track IN ('design_lab','oss_lab')),
  max_uses      INT,
  use_count     INT DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES profiles(id),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- CONTENT HIERARCHY
CREATE TABLE tracks (
  id            TEXT PRIMARY KEY, -- 'design_lab', 'oss_lab'
  name          TEXT NOT NULL,
  description   TEXT
);

CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      TEXT NOT NULL REFERENCES tracks(id),
  title         TEXT NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  slug          TEXT NOT NULL UNIQUE,
  sort_order    INT NOT NULL,
  -- Mission fields (null if not a mission)
  is_mission    BOOLEAN DEFAULT false,
  review_type   TEXT CHECK (review_type IN ('completion_only','reviewed')),
  rubric        JSONB,       -- structured rubric for reviewers
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  content_path  TEXT NOT NULL, -- path to MDX file in repo
  video_url     TEXT,          -- YouTube unlisted URL
  transcript    TEXT,
  summary       TEXT,
  sort_order    INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, slug)
);

-- MISSION DEADLINES (per cohort, since content is shared but deadlines differ)
CREATE TABLE mission_deadlines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  due_at        TIMESTAMPTZ NOT NULL,
  UNIQUE(module_id, cohort_id)
);

-- PROGRESS & COMPLETIONS
CREATE TABLE module_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  module_id     UUID NOT NULL REFERENCES modules(id),
  completed_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- DELIVERABLES & SUBMISSIONS (first-class: OS-ready)
CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  module_id     UUID NOT NULL REFERENCES modules(id),  -- the mission
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  link_url      TEXT NOT NULL,      -- Figma/GitHub/etc
  file_url      TEXT,               -- R2 URL for optional upload
  file_name     TEXT,
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','in_review','passed','needs_revision')),
  is_late       BOOLEAN DEFAULT false,
  version       INT NOT NULL DEFAULT 1,
  parent_id     UUID REFERENCES submissions(id), -- links to previous submission on resubmit
  submitted_at  TIMESTAMPTZ DEFAULT now()
);

-- REVIEWS
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES profiles(id),
  outcome       TEXT NOT NULL CHECK (outcome IN ('passed','needs_revision')),
  comment       TEXT NOT NULL,
  rubric_scores JSONB,       -- optional structured scores against rubric
  reviewed_at   TIMESTAMPTZ DEFAULT now()
);

-- WORKSHOPS
CREATE TABLE workshops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'Africa/Lagos',
  meeting_url   TEXT NOT NULL,
  recording_url TEXT,         -- YouTube unlisted URL, added post-session
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- RESOURCES
CREATE TABLE resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('link','file')),
  url           TEXT NOT NULL,  -- external URL or R2 URL
  file_name     TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  scope         TEXT NOT NULL CHECK (scope IN ('global','cohort')),
  cohort_id     UUID REFERENCES cohorts(id), -- null if global
  author_id     UUID NOT NULL REFERENCES profiles(id),
  published_at  TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  type          TEXT NOT NULL, -- 'workshop_created','review_completed','announcement'
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- CERTIFICATES
CREATE TABLE certificates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  track         TEXT NOT NULL,
  issued_at     TIMESTAMPTZ DEFAULT now(),
  slug          TEXT NOT NULL UNIQUE  -- for public shareable URL
);

-- OS-READY: Contribution ledger (thin in V1, grows in V2)
-- Every passed deliverable is also a contribution record.
CREATE TABLE contributions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  submission_id UUID REFERENCES submissions(id),
  type          TEXT NOT NULL DEFAULT 'deliverable', -- V2: 'review','mentorship','oss_contribution'
  title         TEXT NOT NULL,
  description   TEXT,
  artifact_url  TEXT,          -- link to the work
  verified      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### OS-Readiness Notes

- `contributions` table decouples reputation from submissions. V2 adds contribution types (reviews, mentorship, OSS commits) without schema migration.
- `submissions` has `version` + `parent_id` for full history chain.
- `rubric_scores` in reviews is JSONB — flexible for V2 structured rubrics.
- `profiles.role` handles role transitions (learner→alumni, alumni→mentor) with a simple update.

---

## 3. Row-Level Security Policies

```sql
-- Profiles: users see own profile; can view others' public info
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Enrollments: scoped access
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own enrollments"
  ON enrollments FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM enrollments e2
               WHERE e2.cohort_id = enrollments.cohort_id
               AND e2.user_id = auth.uid()
               AND e2.role_in_cohort = 'mentor')
  );

-- Submissions: learner sees own; mentor sees cohort; admin sees all
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners see own submissions"
  ON submissions FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM enrollments
               WHERE cohort_id = submissions.cohort_id
               AND user_id = auth.uid()
               AND role_in_cohort = 'mentor')
  );

CREATE POLICY "Learners insert own submissions"
  ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: reviewer can insert; submission owner can read
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review visibility"
  ON reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_id AND s.user_id = auth.uid())
    OR auth.uid() = reviewer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Mentors and admins can create reviews"
  ON reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('mentor','admin'))
  );

-- Invites: admin only
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages invites"
  ON invites FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Modules, lessons, units, tracks: readable by all authenticated users
-- Writable by admin only (content managed via repo + seed scripts)

-- Workshops: readable by cohort members; writable by mentor/admin
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members see workshops"
  ON workshops FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments WHERE cohort_id = workshops.cohort_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Announcements: global visible to all; cohort-scoped visible to cohort
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcement visibility"
  ON announcements FOR SELECT USING (
    scope = 'global'
    OR EXISTS (SELECT 1 FROM enrollments WHERE cohort_id = announcements.cohort_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications: user sees own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
```

---

## 4. Route Map (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/[inviteCode]/page.tsx      # invite-gated signup
│   └── setup-profile/page.tsx            # post-signup profile completion
│
├── (dashboard)/                          # authenticated layout with nav
│   ├── layout.tsx                        # sidebar/top nav: Home·Learn·Missions·Live·Resources·Community
│   ├── home/page.tsx                     # "next step" dashboard
│   │
│   ├── learn/
│   │   ├── page.tsx                      # module list grouped by unit, with progress
│   │   └── [moduleSlug]/
│   │       ├── page.tsx                  # module overview
│   │       └── [lessonSlug]/page.tsx     # lesson: MDX + video + transcript
│   │
│   ├── missions/
│   │   ├── page.tsx                      # mission list with status + deadlines
│   │   └── [missionId]/
│   │       ├── page.tsx                  # mission detail + submission form
│   │       └── submit/page.tsx           # submission flow (or modal)
│   │
│   ├── live/
│   │   └── page.tsx                      # upcoming + past workshops
│   │
│   ├── resources/
│   │   └── page.tsx                      # filterable resource library
│   │
│   ├── community/
│   │   ├── page.tsx                      # member directory
│   │   └── showcase/page.tsx             # portfolio showcase gallery
│   │
│   ├── profile/
│   │   └── page.tsx                      # own profile + edit
│   │
│   └── notifications/
│       └── page.tsx                      # notification history
│
├── (admin)/                              # admin-only layout
│   ├── layout.tsx
│   ├── cohorts/
│   │   ├── page.tsx                      # cohort list
│   │   └── [cohortId]/page.tsx           # cohort detail: members, progress, deadlines
│   ├── invites/page.tsx                  # invite link management
│   ├── users/page.tsx                    # user management + role assignment
│   ├── reviews/page.tsx                  # review queue (also accessible to mentors)
│   ├── workshops/
│   │   └── new/page.tsx                  # create/edit workshop
│   ├── resources/
│   │   └── new/page.tsx                  # create/edit resource
│   └── announcements/
│       └── new/page.tsx                  # create announcement
│
├── certificate/[slug]/page.tsx           # public certificate view (no auth)
│
├── api/
│   ├── auth/callback/route.ts            # Supabase auth callback
│   ├── invites/validate/route.ts         # validate invite code
│   ├── uploads/route.ts                  # R2 upload (presigned URL generation)
│   ├── notifications/route.ts            # mark read, etc.
│   └── certificates/generate/route.ts    # PDF generation
│
└── layout.tsx                            # root layout, providers
```

---

## 5. Auth Flow

```
1. Admin generates invite link → /signup/[inviteCode]
2. Client calls /api/invites/validate → returns track + cohort if valid
3. User enters email + password → Supabase auth.signUp()
4. On auth callback:
   a. Create profiles row (role='learner', track from invite)
   b. Create enrollments row (user_id, cohort_id from invite)
   c. Increment invite use_count
5. Redirect to /setup-profile (one-time)
6. Subsequent logins → Supabase auth.signInWithPassword() → /home
```

**Session:** Supabase handles JWT refresh. Middleware checks session on every `(dashboard)` and `(admin)` route. Admin routes additionally check `profiles.role = 'admin'`.

---

## 6. File & Video Handling

### Video (YouTube)
- Store YouTube URL in `lessons.video_url`.
- Render with `<iframe>` embed: `youtube.com/embed/{videoId}?rel=0&modestbranding=1`.
- No autoplay. Poster frame loads first (low bandwidth).
- Transcript + summary stored as text in DB (rendered as expandable section below video).

### File Uploads (R2)
- Submissions: learner uploads PDF/image (max 10 MB).
- Resources: admin uploads PDF.
- Avatars: profile image upload.
- Flow: client requests presigned upload URL from `/api/uploads` → uploads directly to R2 → stores R2 URL in DB.
- R2 bucket: single bucket, key-prefixed: `submissions/{id}/`, `resources/{id}/`, `avatars/{id}/`.

---

## 7. PWA & Offline Strategy

- **Service worker** (via Serwist/next-pwa): caches app shell (HTML, CSS, JS, fonts).
- **Reading materials:** MDX-rendered pages cached via runtime caching (stale-while-revalidate).
- **Progress writes:** optimistic UI updates. If offline, queue writes in IndexedDB, sync on reconnect.
- **Video:** NOT cached offline. YouTube embeds require connectivity.
- **Manifest:** installable PWA with BitDesigners icon, theme color, standalone display.

---

## 8. Email (Resend)

Triggered server-side via Resend API. Templates:

| Trigger | Recipient | Content |
|---|---|---|
| Workshop created | Cohort members | Title, date/time, join link |
| Deliverable reviewed | Submission author | Outcome, reviewer comment, link to submission |
| Global announcement | All active learners | Title, body excerpt, link |
| Welcome | New signup | Welcome message, link to home |

Rate limit: 100 emails/day (free tier). At 80 learners, budget is ~1.25 emails/user/day — sufficient for V1 event-driven notifications.

---

## 9. MDX Content Pipeline

```
content/
├── design-lab/
│   ├── unit-01-foundations/
│   │   ├── module-01-intro/
│   │   │   ├── lesson-01.mdx
│   │   │   └── lesson-02.mdx
│   │   └── module-02-bitcoin-basics/
│   │       └── lesson-01.mdx
│   └── unit-02-labs/
│       └── ...
└── oss-lab/
    └── ...
```

- MDX files compiled at build time (next-mdx-remote).
- Module/lesson metadata (title, order, video URL, transcript) stored in DB and seeded from frontmatter or a `content-manifest.json`.
- Admin edits content via git push → Vercel rebuilds. No runtime CMS.

---

## 10. Phased Build Plan (12 weeks)

### Phase 1: Foundation (Weeks 1–3)

| Week | Deliverable |
|---|---|
| 1 | Project setup: Next.js + Tailwind + shadcn/ui + Supabase. DB schema + migrations + RLS policies. Auth flow (signup/login). Invite system (generate + validate). |
| 2 | Profile setup. Layout shell with nav (Home · Learn · Missions · Live · Resources · Community). Role-based route protection middleware. |
| 3 | Content pipeline: MDX setup, content manifest seeding. Learn page: module list, unit grouping, progress tracking. Lesson page: MDX render + YouTube embed + transcript. |

**Milestone:** A learner can sign up via invite, see modules, consume lessons.

### Phase 2: Core Loop (Weeks 4–6)

| Week | Deliverable |
|---|---|
| 4 | Missions page. Submission flow (link + file upload to R2). Submission status tracking. Soft deadline logic. |
| 5 | Review queue (mentor/admin). Pass/needs-revision + comment. Resubmission flow. Submission history. |
| 6 | Home "next step" dashboard. Module completion tracking. Progress display on Learn page. Advisory gating for Labs. |

**Milestone:** Full learn → submit → review loop working end-to-end.

### Phase 3: Community & Live (Weeks 7–9)

| Week | Deliverable |
|---|---|
| 7 | Workshop CRUD. Live page (upcoming + past). Recording URL addition. |
| 8 | Resource library (CRUD + filter + search). Community directory. Showcase page (passed deliverables). |
| 9 | Announcements (create + display). Notification system (in-app + email via Resend). |

**Milestone:** All five pillars + connective tissue complete.

### Phase 4: Polish & Ship (Weeks 10–12)

| Week | Deliverable |
|---|---|
| 10 | Admin panel: cohort management, user management, invite management. Certificate generation (PDF + public URL). |
| 11 | PWA setup (service worker, offline reading, manifest). Mobile responsiveness pass. Performance optimization (Core Web Vitals on 3G). |
| 12 | End-to-end testing. Bug fixes. Content seeding for cohort 1. Staging deploy → production deploy. |

**Milestone:** Production-ready for cohort 1.

### Risk Buffers
- Weeks 10–12 have built-in slack. If Phases 1–3 run long, polish absorbs the overflow.
- If 2 builders: parallelize — one on content/learn (P1–P2), one on missions/review (P2) and community (P3).
- If 1 builder: the plan is still viable but Phase 4 may compress to bug fixes only.

---

## 11. Infrastructure Diagram

```
┌─────────────┐     invite link      ┌──────────────┐
│  Typeform/   │ ──────────────────→  │   Learner    │
│  Tally       │  (external screen)   │   Browser    │
└─────────────┘                       └──────┬───────┘
                                             │
                                    HTTPS (Vercel Edge)
                                             │
                                      ┌──────▼───────┐
                                      │   Next.js    │
                                      │  App Router  │
                                      │   (Vercel)   │
                                      └──┬───┬───┬───┘
                                         │   │   │
                        ┌────────────────┘   │   └────────────────┐
                        │                    │                    │
                 ┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼──────┐
                 │  Supabase   │   │  Cloudflare R2  │   │   Resend    │
                 │  Postgres   │   │  (file uploads) │   │   (email)   │
                 │  + Auth     │   └─────────────────┘   └─────────────┘
                 │  + RLS      │
                 └─────────────┘
                                      ┌─────────────┐
                                      │   YouTube    │
                                      │  (unlisted   │
                                      │   embeds)    │
                                      └─────────────┘
```
