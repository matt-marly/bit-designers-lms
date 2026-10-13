# BitDesigners Africa — System Architecture (V1)

> Constraints: $0/month (all free tiers), 50–80 learners/cohort, 1–2 builders + Claude Code, 12 weeks.
> Data model is OS-ready: contributions, deliverables, and reputation are first-class entities from day one.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | SSR for slow networks, full-stack |
| Styling | Tailwind CSS + shadcn/ui | Premium components fast, no bootcamp look |
| Database + backend | Convex (reactive document DB + TypeScript functions) | Free tier, transactional mutations, real-time by default |
| Auth | Clerk (email/password + email verification codes) | Free tier, integrates with Convex via JWT |
| File storage | Convex file storage | Submissions, avatars and PDF materials; same transaction as the data, no extra service |
| Video | YouTube / Vimeo embeds | Free, adaptive bitrate, zero infra |
| Email | Clerk (invitations only) | Everything else is an in-app notification; no email service to run |
| Hosting | Vercel | Free tier, edge, integrates with Next.js |
| Content | Markdown stored in Convex, edited in Admin → Curriculum | Mentors edit lessons without git or a redeploy |
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
Track 1──* Cohort
Track 1──* TrackMember *──1 User   (lead_mentor | co_mentor, with track permissions)
Track 1──* Unit 1──* Module 1──* Lesson
Module 1──* Mission (brief, rubric, review_type); Mission 1──* MissionDeadline *──1 Cohort
Invitation *──1 User (invitedBy); carries platform role, permissions and track grants
```

### Schema

> The source of truth is [`convex/schema.ts`](../convex/schema.ts). The SQL below is the original logical model and is kept for reference. In Convex, `profiles` is merged into a `users` table keyed by the Clerk `tokenIdentifier`, `created_at` is replaced by the built-in `_creationTime`, timestamps are epoch milliseconds, and uniqueness is enforced inside mutations.
>
> The Convex schema also differs from the SQL in these ways:
> - `tracks` is a real table (admins create tracks), and everything that used the `track` text column now references `trackId`.
> - `users.role` is replaced by `platformRole`, an explicit `permissions` array, and `status` (active or suspended).
> - `trackMembers` holds each track's lead mentor and co-mentors. `enrollments.role_in_cohort` is gone; students are the people enrolled in a cohort.
> - `invites` (shareable codes) is replaced by `invitations` (one per email address, sent through Clerk).
> - `lessons.content_path` is replaced by `body`, the lesson's Markdown. Lessons also carry `trackId`.
> - `modules` has `trackId`, a `status` (draft or published), `objectives`, and a `lessonCount` kept in sync by the editor mutations so progress can be computed without reading lesson bodies. Module slugs are unique across all tracks; lesson slugs are unique within their module.
> - `lessonCompletions` records each lesson a learner marks done. `moduleCompletions` is written automatically when every lesson in a module is done and every mission in it is satisfied, and removed when that stops being true.
> - Missions are their own `missions` table instead of `is_mission` / `review_type` / `rubric` columns on `modules`. A module can have any number of missions. Each has a Markdown `brief`, a `rubric` (a list of criteria), a `reviewType` and a globally unique `slug`. `missionDeadlines` holds one optional due date per mission and cohort.
> - `submissions` reference `missionId` and carry `trackId` and `cohortId` for the review queue indexes. Each resubmission is a new row with the next `version` instead of a `parent_id` chain. A file is optional and lives in Convex file storage (`fileId`, `fileName`). Completion-only work is stored as `passed` straight away, so `submitted` and `in_review` only ever hold work waiting on a reviewer. `isLate` is set when the work arrives after the cohort's deadline; `reviewerId` and `reviewedAt` record who claimed or finished the review.
> - `reviews.rubric_scores` is replaced by `rubricChecks`, one boolean per rubric criterion, and `feedback` by a required `comment`.

```sql
-- USERS & AUTH (Clerk handles email/password; this is the app profile)
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
- Role transitions (learner → alumni → mentor) are grants rather than a single column: a former student can be added as a co-mentor on a track without losing their enrollment history.

---

## 3. Authorization

Convex has no row-level security. Every public query and mutation derives the caller from `ctx.auth.getUserIdentity()` and checks access itself, using the helpers in [`convex/lib/auth.ts`](../convex/lib/auth.ts): `requireUser`, `requirePlatformPermission`, `getTrackAccess` and `requireTrackPermission`. Functions never accept a user ID as an argument for authorization. Suspended users fail `requireUser` everywhere.

### Permissions

Access has two layers. The permission catalog lives in [`convex/lib/permissions.ts`](../convex/lib/permissions.ts).

**Platform layer** (`users.platformRole` + `users.permissions`). The role is a preset that pre-fills the permission checklist when inviting. Only the explicit `permissions` array is checked at runtime, so an inviter can give an admin fewer permissions than the preset.

| Permission | Grants |
|---|---|
| `invites.manage` | Invite anyone to the platform; see and revoke all invitations |
| `users.manage` | Change people's platform permissions; suspend accounts |
| `tracks.manage` | Create tracks and cohorts; assign lead mentors and co-mentors |
| `content.manage` | Edit curriculum in every track |
| `reviews.manage` | Review submissions in every track |
| `workshops.manage` | Manage live sessions in every track |
| `announcements.global` | Post platform-wide announcements |
| `resources.manage` | Manage the shared resource library |

| Preset | Permissions |
|---|---|
| Super admin | All, plus the right to create or change other super admins |
| Admin | All except `users.manage` |
| Platform mentor | `content.manage`, `reviews.manage`, `workshops.manage` |
| Member | None; access comes only from track roles |

**Track layer** (`trackMembers` + `enrollments`). Each track has one **lead mentor**, who holds every track permission (`track.content`, `track.reviews`, `track.workshops`, `track.announcements`, `track.students.invite`, `track.cohorts`). **Co-mentors** hold only the track permissions they were given. **Students** are enrolled in one of the track's cohorts and can view the track's content. Platform permissions carry over to every track: for example, `reviews.manage` counts as `track.reviews` everywhere.

**Anti-escalation rules** (`assertCanGrant` in [`convex/lib/grants.ts`](../convex/lib/grants.ts)):
- Nobody can grant a permission they don't hold. Super admins are the exception.
- Granting any platform access requires `invites.manage`. Only super admins can create super admins.
- Assigning a lead mentor requires `tracks.manage`.
- Adding a co-mentor requires `tracks.manage` or being that track's lead, and co-mentor permissions must come from the inviter's own track permissions.
- Inviting a student requires `track.students.invite` on that track and a cohort that belongs to the track.
- Nobody can change their own permissions or suspend themselves.

**Managing existing people** (`/admin/members`, requires `users.manage`). The page lists everyone with their platform role and track roles. From there you can change someone's platform role and permissions (`users.updatePermissions`) or suspend and reactivate them (`users.setStatus`). The same rules apply: you can only add or remove permissions you hold, and only a super admin can manage another super admin. Suspension takes effect immediately: the backend rejects the user's requests, and `AuthBootstrap` watches `users.me` and swaps the app for the "Account suspended" screen. Their access is kept, so reactivating them restores it.

**Managing tracks** (`/admin/tracks`). The page shows tracks you manage (`tracks.manage`), lead or co-mentor, or hold `track.cohorts` on. What you can do on each track follows your permissions there (`tracks.getForAdmin` returns them as `capabilities`):
- `tracks.manage`: create, rename and archive tracks, assign the lead mentor, and remove anyone from a track's staff.
- Lead mentor (or `tracks.manage`): add co-mentors, change their track permissions, and remove them.
- `track.cohorts`: create and edit cohorts, move students between cohorts, and unenroll them.
- `track.students.invite`: add students to a draft or active cohort.

Adding a mentor or student by email goes through `invitations.create`, so the anti-escalation rules above apply. People who already have an account get the role straight away; anyone else gets an invitation email.

**Editing curriculum** (`/admin/curriculum`, requires `track.content` on the track, which `content.manage` grants on every track). Editors build the unit → module → lesson outline, reorder items, and write each lesson in Markdown with a live preview (`/admin/curriculum/lessons/[lessonId]`). The functions live in `convex/curriculumEditor.ts`. Rules:
- New modules start as drafts. A module can only be published once it has a lesson, and deleting its last lesson puts it back in draft.
- Drafts are hidden from learners everywhere: the Learn page, module and lesson pages, Home, and progress totals. Editors see them, marked as drafts, so they can preview.
- Units and modules must be empty before they can be deleted. Deleting a lesson or module removes learners' completions for it in background batches.
- Archived tracks are read-only for learners and can't get new units.

**Learning** (`convex/curriculum.ts`). Anyone who can view a track (students, staff, and platform roles with access) can read its published modules. `getModule` and `getLesson` return `null` instead of throwing when a module is missing, a draft, or in a track the caller can't see, so the pages can show "not found". `setLessonComplete` marks a lesson done or not done and keeps the module completion in step. Gating between modules is advisory: the module page notes when the previous module isn't finished, but doesn't block.

**Missions** are practical work attached to a module.
- **Editing** (`convex/missionsEditor.ts`, requires `track.content`). Editors add missions from the module panel and edit them at `/admin/curriculum/missions/[missionId]`: title, review type, Markdown brief, rubric (up to 12 criteria) and a due date per cohort. Missions follow their module's draft or published status. A mission with submissions can't be deleted, and a module can't be deleted while it has missions. Adding a mission reopens the module for learners who had finished it, in background batches.
- **Submitting** (`convex/missions.ts`). Only students enrolled in the track can submit, and only to missions in published modules of active tracks. A submission is a link (http or https) plus an optional note and an optional file (PDF, PNG, JPG or WebP, up to 10 MB) uploaded through `generateUploadUrl`. `submit` returns `{ ok: false, error }` instead of throwing for validation problems so it can delete a rejected upload in the same transaction. Reviewed missions can be resubmitted only after a "needs revision" review; completion-only missions can be updated any time. Deadlines are soft: late work is accepted and flagged.
- **Reviewing** (`convex/reviews.ts`, requires `track.reviews`, which `reviews.manage` grants on every track). The queue at `/admin/review` has To review, In review and Reviewed tabs across every track the reviewer can review. "Start review" claims a submission so others see who's on it. A review records Pass or Needs revision, a required comment and optional rubric checks. Nobody can review their own work.
- **Completion.** A module is complete when every lesson is done and every mission is satisfied: completion-only missions once submitted, reviewed missions once passed. `submit`, `review` and `setLessonComplete` all recompute it through `recomputeModuleCompletion` in `convex/lib/missions.ts`.

The SQL policies below predate this model and are kept as a description of intended visibility. Read `role = 'admin'` as "has the matching platform permission" and `role_in_cohort = 'mentor'` as "track staff with the matching track permission".

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

-- Invitations: people with invites.manage see all; everyone else sees the ones they sent

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
├── login/page.tsx
├── accept-invite/page.tsx                # Clerk invitation ticket → account creation
├── welcome/page.tsx                      # shown once after first sign-in; skippable
│
├── (dashboard)/                          # authenticated layout: sidebar, mobile top bar, notification bell
│   ├── layout.tsx                        # sends people who haven't onboarded to /welcome
│   ├── home/page.tsx                     # next step, next live session, announcements, certificate banner
│   ├── learn/
│   │   ├── page.tsx                      # module list grouped by unit, with progress
│   │   └── [moduleSlug]/
│   │       ├── page.tsx                  # module overview
│   │   └── [lessonSlug]/page.tsx     # lesson: Markdown + video + transcript + mark complete
│   ├── roadmaps/
│   │   ├── page.tsx                      # library: per-track paths + standalone guides
│   │   └── [slug]/page.tsx               # lane-grouped steps, progress from lessons/missions
│   ├── missions/
│   │   ├── page.tsx                      # mission list with status + deadlines
│   │   └── [missionSlug]/page.tsx        # brief, submission form, history (read-only for alumni)
│   ├── live/page.tsx                     # upcoming + past sessions, .ics download, recordings
│   ├── materials/page.tsx                # reading list (links and PDFs)
│   ├── reference/page.tsx                # video and link library
│   ├── community/page.tsx                # channels, cohort directory, mentors, showcase
│   ├── profile/page.tsx                  # avatar, bio, portfolio, showcase opt-out, progress, certificates
│   └── notifications/page.tsx            # notification history, mark all read
│
├── admin/                                # staff layout; tabs filtered by permission
│   ├── page.tsx                          # overview: learners, review backlog, weekly activity
│   ├── tracks/page.tsx                   # tracks, their cohorts and students, lead + co-mentors
│   ├── curriculum/
│   │   ├── page.tsx                      # unit → module → lesson outline, publish, reorder
│   │   ├── lessons/[lessonId]/page.tsx   # lesson editor: Markdown with preview, video, transcript
│   │   └── missions/[missionId]/page.tsx # mission editor: brief, rubric, deadlines
│   ├── roadmaps/
│   │   ├── page.tsx                      # generate from track, custom steps, publish
│   │   └── [roadmapId]/page.tsx           # lane-grouped steps, badges, reorder
│   ├── invites/page.tsx                  # email invitations: platform permissions + track grants
│   ├── members/page.tsx                  # user management + permission changes
│   ├── review/page.tsx                   # review queue
│   ├── announcements/page.tsx            # compose (global or per cohort) + published list
│   ├── sessions/page.tsx                 # schedule, edit, cancel sessions; add recordings
│   └── resources/page.tsx                # Materials and Reference entries, PDF uploads, ordering
│
├── certificates/[code]/page.tsx          # public certificate (no sign-in); print → PDF
└── layout.tsx                            # root layout, Clerk + Convex providers
```

There are no API routes: uploads go straight to Convex storage through
`generateUploadUrl` mutations, and everything else is a Convex query or mutation.

---

## 5. Auth Flow

```
1. An inviter fills in Admin → Invites: email, platform role/permissions, track grants
   (student in a cohort, co-mentor with chosen permissions, or lead mentor)
2. invitations.create checks assertCanGrant, then:
   - if the email already has an account → grants are applied immediately
   - otherwise → inserts an invitation (pending) and schedules invitations.sendClerkInvite
3. sendClerkInvite calls Clerk's Backend API (POST /v1/invitations) with
   redirect_url = SITE_URL/accept-invite; Clerk emails the link. Status → sent (or failed + error)
4. The invitee opens /accept-invite?__clerk_ticket=… and enters name + password
   → signUp.create({ strategy: "ticket", ticket, password }) → finalize()
   (the ticket proves the email address, so no verification code is needed)
5. users.ensureCurrent({ fullName }) matches the verified email from the Clerk JWT to the
   open invitation, creates the users row, applies the grants, marks the invitation accepted
6. Redirect to /admin (anyone with a platform permission or track staff role) or /home
7. Subsequent logins → Clerk signIn.password() (plus an email code on new devices).
   AuthBootstrap calls users.ensureCurrent on every sign-in; accounts without an invitation
   or that are suspended see a "no access" screen with a sign-out button
```

**Session:** Clerk handles sessions and token refresh; `ConvexProviderWithClerk` passes Clerk's JWT to Convex. Clerk's sign-up mode is **Restricted**, so only invited emails can create accounts. `proxy.ts` (Next.js 16's replacement for middleware) redirects signed-out users to `/login` on every route except `/login`, `/accept-invite` and `/certificates/[code]`. The admin layout requires `me.hasAdminAccess` and hides tabs the user has no permission for, but the real checks are in the Convex functions.

Invitations can be revoked (the Clerk invitation is revoked too) or resent (the old Clerk invitation is revoked and a new one sent) by the inviter or anyone with `invites.manage`.

---

## 6. File & Video Handling

### Video (YouTube)
- Store the link in `lessons.videoUrl` (any http or https URL).
- `lib/video.ts` turns YouTube links into `youtube-nocookie.com/embed/{videoId}?rel=0&modestbranding=1` and Vimeo links into `player.vimeo.com/video/{id}`. Other links are shown as "Watch the video".
- No autoplay. Poster frame loads first (low bandwidth).
- Transcript + summary stored as text in DB (rendered as expandable section below video).

### File Uploads (Convex storage)
- Submissions: PDF or image, max 10 MB (`missions.generateUploadUrl` → `missions.submit`).
- Materials: PDF, max 20 MB (`resources.generateUploadUrl` → `resources.create` / `update`).
- Avatars: PNG, JPG or WebP, max 2 MB (`users.generateAvatarUploadUrl` → `users.setAvatar`).
- Flow: the client asks a mutation for an upload URL, POSTs the file to it (`lib/upload.ts`), then passes the storage ID to the saving mutation. That mutation checks size and content type from `_storage`; a rejected file is deleted in the same transaction and the mutation returns `{ ok: false, error }` instead of throwing, so the delete isn't rolled back.
- Replacing or removing an avatar or a PDF material deletes the old file.

---

## 6b. Engagement features

| Feature | Backend | Who can write | Who can read |
|---|---|---|---|
| Live sessions | `convex/workshops.ts` | `track.workshops`, cohorts that haven't ended | Learners see their cohort's sessions; staff see the whole track |
| Announcements | `convex/announcements.ts` | Global: `announcements.global`. Cohort: `track.announcements` | Feed shows global posts plus the viewer's cohort |
| Notifications | `convex/notifications.ts`, `convex/lib/notifications.ts` | Created by the server only | Each user sees their own |
| Materials & Reference | `convex/resources.ts` | `resources.manage` | Everyone; track-specific entries only for people who can view that track |
| Community | `convex/community.ts` | — | Learners: own cohort and mentors. Staff: every cohort in the track. No emails |
| Showcase | `convex/community.ts` | Learners opt out from their profile | Anyone in the track; passed work on reviewed missions only |
| Certificates | `convex/lib/certificates.ts`, `convex/certificates.ts` | Issued automatically | Owner via `certificates.mine`; anyone by code via `certificates.getByCode` |

- **Times.** Sessions are stored as UTC milliseconds with the host's IANA time zone. Pages show the viewer's local time plus the host's time when they differ. Queries never read `Date.now()`: the client passes `now` (`workshops.next`, `adminOverview.overview`) using `lib/use-now.ts`.
- **Fan-out.** Scheduling a session or posting an announcement schedules `notifications.fanOutToCohort` or `fanOutGlobal`, which notify 200 people per run and reschedule themselves with a cursor. Suspended users and the author are skipped. Reviews notify the learner directly. "Mark all read" works the same way in batches.
- **Alumni.** Learners in a `completed` or `archived` cohort are alumni: they keep read access to the track and their work, but can't submit new versions, and they're labeled "Alumni" in the app.
- **Certificates.** When a learner's module completion is recorded (`recomputeModuleCompletion`), `maybeIssueCertificate` checks whether every published module in the track is complete. If so, and they're enrolled and don't already have one, it issues a certificate with a random code (`BD-XXXX-XXXX-XXXX`) and sends a notification. Certificates are never revoked. The public page prints to a single A4 landscape page ("Download PDF" uses the browser's print dialog).

---

## 7. PWA & Offline Strategy

- **Service worker** (via Serwist/next-pwa): caches app shell (HTML, CSS, JS, fonts).
- **Reading materials:** lesson pages cached via runtime caching (stale-while-revalidate).
- **Progress writes:** optimistic UI updates. If offline, queue writes in IndexedDB, sync on reconnect.
- **Video:** NOT cached offline. YouTube embeds require connectivity.
- **Manifest:** installable PWA with BitDesigners icon, theme color, standalone display.

---

## 8. Email and notifications

V1 sends no email of its own. Clerk sends the invitation email; everything else is an in-app notification (bell in the sidebar and mobile top bar, history at `/notifications`):

| Trigger | Recipient | Notification |
|---|---|---|
| Session scheduled | Cohort members | Title and time, links to `/live` |
| Work reviewed | Submission author | "Your work passed" / "Needs revision", reviewer comment, links to the mission |
| Announcement posted | Cohort members, or every active user for global posts | Title and a plain-text preview, links to `/home` |
| Certificate issued | The learner | Links to the certificate |

Email delivery (for example digests through Resend) can be added later by reading the same `notifications` table.

---

## 9. Content Pipeline

- Lessons are Markdown stored in `lessons.body` (up to 50,000 characters), written in Admin → Curriculum. Changes are live as soon as they're saved; there's no build step.
- `components/markdown.tsx` renders lessons with `react-markdown` and `remark-gfm` (tables, task lists, strikethrough). Raw HTML is not rendered and unsafe link schemes are stripped. Styles are the `.lesson-prose` rules in `app/globals.css`.
- Sample content for Design Lab: `bunx convex run seed:curriculum` (does nothing if the track already has units). The content is in `convex/lib/sampleCurriculum.ts`.
- Starter Materials and Reference entries: `bunx convex run seed:resources` (skips titles that already exist). The content is in `convex/lib/sampleResources.ts`; after that, edit them in Admin → Resources.
- **Roadmaps** (`convex/roadmaps.ts`, `convex/roadmapEditor.ts`, tables `roadmaps` + `roadmapNodes`). Editors generate a path from a track's published outline (units become lanes, modules become nodes), then add custom steps, set `required`/`optional`/`alternative` badges, reorder, and publish. `syncFromTrack` adds new modules and drops deleted ones while keeping custom steps. Learners read them at `/roadmaps` and `/roadmaps/[slug]`; progress is derived from lesson/module completions and mission status, never stored. Starter global guides: `bunx convex run seed:roadmaps`.
- **Roadmap graph** (`components/roadmaps/graph-layout.ts` + `roadmap-graph.tsx`). The detail page renders a roadmap.sh-style node graph on desktop: a pure serpentine auto-layout (lanes become alternating-direction rows, missions become full-width checkpoint rows, optional badges become dotted connectors) drawn as SVG edges with HTML nodes, pan/zoom controls, yellow topics and dark checkpoints on a dark canvas. Positions are derived every render — no stored x/y. Mobile falls back to the vertical lane list, with a Graph/List toggle on both.
- **Node drawer** (`components/roadmaps/node-drawer.tsx`, `convex/roadmapProgress.ts`, table `roadmapNodeStates`). Clicking any graph or list node opens a roadmap.sh-style drawer: Recommended card (the linked module/lesson/mission with a Start link, lesson checklist, or mission rubric), related track resources, and a Learning/Done/Skip control. States are stored per learner and override derived progress (`done` counts as complete; `skipped` is excluded from totals); the drawer deep-links via `?node=<id>`. The AI Tutor tab and ask box are stubbed until an LLM integration lands.

---

## 10. Phased Build Plan (12 weeks)

### Phase 1: Foundation (Weeks 1–3)

| Week | Deliverable |
|---|---|
| 1 | Project setup: Next.js + Tailwind + shadcn/ui + Convex + Clerk. Convex schema + authorization helpers. Auth flow (accept invitation/login). Email invitations with platform permissions and track grants. |
| 2 | Profile setup. Layout shell with nav (Home · Learn · Missions · Live · Resources · Community). Role-based route protection middleware. |
| 3 | Curriculum editor (Markdown in Convex). Learn page: module list, unit grouping, progress tracking. Lesson page: Markdown render + YouTube embed + transcript. |

**Milestone:** A learner can accept an email invitation, see modules, consume lessons.

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
┌─────────────┐  invitation email    ┌──────────────┐
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
                 │   Convex    │   │  Cloudflare R2  │   │   Resend    │
                 │  DB + funcs │   │  (file uploads) │   │   (email)   │
                 │  + storage  │   └─────────────────┘   └─────────────┘
                 └──────┬──────┘
                        │ JWT
                 ┌──────▼──────┐
                 │    Clerk    │
                 │   (auth)    │
                 └─────────────┘
                                      ┌─────────────┐
                                      │   YouTube    │
                                      │  (unlisted   │
                                      │   embeds)    │
                                      └─────────────┘
```
