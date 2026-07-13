# BitDesigners Africa — Product Requirements Document (V1)

> Source of truth: `bitdesigners-discovery.md` (all [DECIDED] items are fixed constraints).
> Scope: V1 only. Items marked [V2+] in discovery are explicitly out of scope.

---

## 1. Goals

1. **Produce contributors, not graduates.** Every learner who completes the program has at least one portfolio-worthy, implementation-ready artifact.
2. **Ship a premium LMS-shaped experience** with an OS-ready data model (contributions, deliverables, reputation are first-class from day one).
3. **Zero-cost infrastructure** at 50–80 learners/cohort using free tiers only.
4. **Mobile-first, low-bandwidth resilient** — usable on intermittent African mobile connections.

## 2. Non-Goals (V1)

- AI mentor, 1:1 mentorship system, peer review, numeric grading.
- GitHub API integration (learners link out manually).
- Bitcoin-native primitives (Nostr, Lightning, on-chain credentials).
- Payments, bounties, checkout.
- In-platform community/discussion (Discord handles this).
- Offline video caching.
- Multi-language support.
- Application/screening workflow (handled externally via Typeform/Tally).
- CMS for content editing (content is MDX in repo).

## 3. Personas

### Learner
Design-literate (product/UX/UI/visual designer or UX researcher). Bitcoin knowledge ranges from beginner to already-working-in-Bitcoin. Likely on a mobile device with variable connectivity. Joins via invite link after external screening.

### Mentor
Experienced Bitcoin designer assigned to a cohort. Reviews capstone/flagged deliverables. Hosts live workshops. Does not do 1:1 mentorship in V1.

### Admin
Program operator. Generates invite links, manages cohorts, creates/edits content (via repo), manages users/roles, reviews any deliverable, posts global announcements.

### Alumni
Post-cohort learner. Retains read access to resources, directory, showcase, and their own portfolio. Cannot submit new work.

## 4. User Journeys

### J1: Learner Onboarding
1. Learner receives track-specific invite link (from admin, after external screening).
2. Clicks link → signup page with email + password. Track and cohort auto-assigned from invite.
3. Completes minimal profile (name, bio, avatar, portfolio URL).
4. Lands on Home — "next step" view with cohort context, first module CTA.

### J2: Self-Paced Learning
1. Learner navigates to Learn → sees module list with completion state.
2. Opens a module → watches embedded YouTube video (unlisted), reads text/MDX content, sees transcript + summary.
3. Completes module reading/video → marks as complete (or auto-completes on deliverable submission if module has one).
4. Advisory gate: if learner tries to access Labs content without Foundations completion, sees a warning but is not hard-blocked. Foundations complete = all modules in Unit 01 marked complete.

### J3: Mission Submission & Review
1. Learner opens a mission (module tagged with cohort deadline).
2. Submits: pastes link (Figma/GitHub URL) + optional file upload (PDF/image via R2).
3. **Completion-only missions:** status flips to "submitted" — no review required.
4. **Reviewed missions (capstone/flagged):** mentor or admin reviews → **pass** or **needs-revision** + comment against rubric. Learner can resubmit.
5. Learner sees submission history and review status on their dashboard.

### J4: Live Workshops
1. Admin/mentor creates a workshop event: title, description, date/time, external link (Zoom/Meet/etc.), assigned cohort.
2. Learners see upcoming workshops on Home and Live page.
3. After workshop, admin/mentor uploads recording (YouTube unlisted link) to the event record.
4. Learners can watch recording from the Live page.

### J5: Resource Library
1. Admin adds resources (links, PDFs, categorized by topic/type).
2. Learners browse/search/filter resources.
3. Resources are available to all roles including alumni.

### J6: Community & Showcase
1. **Directory:** all active members visible (name, avatar, bio, track, cohort). Filterable.
2. **Showcase:** completed/approved deliverables displayed as portfolio pieces. Visible to all roles.
3. **Discord link:** prominent link to external community.

### J7: Completion & Certificate
1. Learner completes all required modules + passes all reviewed missions.
2. System auto-generates a decorative PDF certificate with a shareable/verifiable URL.
3. Certificate accessible from learner's profile permanently (survives alumni transition).

---

## 5. Feature Specs — Five Pillars

### Pillar 1: Invite-Gated Onboarding

**What:** Admin generates track-specific invite links. Learners sign up via invite only.

| Requirement | Detail |
|---|---|
| Invite creation | Admin generates link scoped to a track (Design Lab / Open Source Lab) + cohort. Link contains signed token. |
| Invite management | Admin can view active invites, deactivate links, see usage count. |
| Signup flow | Email + password only. Invite token auto-assigns track + cohort. |
| Profile setup | Name (required), bio, avatar upload, portfolio URL. Shown once post-signup. |
| Validation | Invalid/expired/deactivated invite → clear error, no signup. |

**Acceptance Criteria:**
- [ ] Admin can generate an invite link scoped to a specific track + cohort.
- [ ] Admin can list, view usage, and deactivate invite links.
- [ ] Visiting a valid invite link shows a signup form (email + password).
- [ ] Successful signup auto-assigns learner to the correct track and cohort.
- [ ] Profile setup screen appears on first login; skippable fields save empty.
- [ ] Invalid/expired/used-beyond-limit invite shows an error — no account created.
- [ ] Duplicate email is rejected at signup.

---

### Pillar 2: Self-Paced Learning Modules

**What:** Structured content organized as modules within tracks. Video (YouTube unlisted embed) + MDX text + transcript/summary per lesson.

| Requirement | Detail |
|---|---|
| Module structure | Track → Unit → Module → Lesson. Modules have ordering, metadata, prerequisites (advisory). |
| Lesson content | MDX body + optional YouTube embed (unlisted URL, `rel=0`, `modestbranding=1`) + transcript + summary. |
| Completion tracking | Per-learner per-module. Manual "mark complete" or auto on deliverable submission. |
| Progress display | Simple completion percentage per unit and track on Learn page. |
| Advisory gating | Warning banner on Labs modules if Foundations incomplete. No hard block. |
| Accessibility | Every video has a transcript + text summary as data-free alternative. |

**Acceptance Criteria:**
- [ ] Learn page shows all modules for learner's track, grouped by unit, with completion state.
- [ ] Module page renders MDX content correctly on mobile and desktop.
- [ ] YouTube embed loads with `rel=0`, `modestbranding=1`; respects low-bandwidth (no autoplay).
- [ ] Transcript and summary render below or alongside video.
- [ ] Learner can mark a module complete; state persists across sessions.
- [ ] Progress percentage updates accurately.
- [ ] Labs modules show advisory warning if Foundations prerequisites incomplete.
- [ ] Content renders from MDX files in the repo (no CMS).

---

### Pillar 3: Missions & Deliverables

**What:** Assignments tied to modules with cohort deadlines. Two types: completion-only and reviewed.

| Requirement | Detail |
|---|---|
| Mission definition | A module flagged as a mission with: deadline (per-cohort), review type (completion-only or reviewed), rubric (for reviewed). |
| Submission | Link field (required: Figma/GitHub/other URL) + optional file upload (PDF/image, max 10 MB, stored on R2). |
| Resubmission | Learner can resubmit after "needs-revision"; previous submissions preserved in history. |
| Deadlines | Soft: past-deadline submissions accepted but flagged as late. Learner not locked out. |
| Review (reviewed type) | Mentor/admin sees review queue. Actions: **pass** or **needs-revision** + required comment. Short rubric displayed alongside. |
| Status states | `not-started` → `submitted` → `in-review` → `passed` / `needs-revision` → (resubmit cycle). Completion-only: `not-started` → `submitted`. |

**Acceptance Criteria:**
- [ ] Missions page lists all missions for learner's cohort with status and deadline.
- [ ] Learner can submit a link + optional file; file stored on R2.
- [ ] Late submissions accepted and flagged visually.
- [ ] Completion-only missions flip to "submitted" immediately — no review queue entry.
- [ ] Reviewed missions appear in mentor/admin review queue scoped to their cohort.
- [ ] Reviewer can pass or mark needs-revision with a required comment.
- [ ] Learner sees review outcome + comment and can resubmit if needs-revision.
- [ ] Submission history preserved (all versions visible).
- [ ] File uploads limited to PDF/image, max 10 MB.

---

### Pillar 4: Live Workshops

**What:** Scheduled live sessions with external meeting links. Recordings added post-session.

| Requirement | Detail |
|---|---|
| Event creation | Admin/mentor creates event: title, description, date/time (with timezone), external link, assigned cohort(s). |
| Upcoming view | Learner sees next workshops on Home + Live page, sorted by date. |
| Recordings | Post-session: admin/mentor adds YouTube unlisted URL to event. Displays as embedded player. |
| Notifications | Email notification (via Resend) sent to cohort on new workshop creation. |

**Acceptance Criteria:**
- [ ] Admin/mentor can create a workshop event with all required fields.
- [ ] Live page shows upcoming and past workshops for learner's cohort.
- [ ] Home page shows next upcoming workshop.
- [ ] Clicking "Join" opens external meeting link in new tab.
- [ ] Recording can be added post-event; renders as YouTube embed.
- [ ] Email notification sent to cohort members on event creation.

---

### Pillar 5: Resource Library

**What:** Curated collection of links, PDFs, and references organized by topic.

| Requirement | Detail |
|---|---|
| Resource types | Link (external URL) or file (PDF, uploaded to R2). |
| Metadata | Title, description, type/format, topic tags, author/source. |
| Organization | Filterable by topic tag, searchable by title/description. |
| Access | All roles (including alumni) can browse. Admin can create/edit/delete. |

**Acceptance Criteria:**
- [ ] Admin can add a resource (link or file upload) with metadata and tags.
- [ ] Resource library page displays all resources with filter by tag and search.
- [ ] PDFs open in-browser or download; links open in new tab.
- [ ] Alumni retain access to the resource library.

---

## 6. Connective Features

### 6.1 Home — "Next Step" Dashboard

Learner's landing page. Shows:
- Current cohort week / phase.
- Next incomplete module with direct link.
- Next mission deadline with status.
- Next upcoming workshop.
- One primary CTA (the most urgent next action).
- Announcements (latest 2–3).

**Acceptance Criteria:**
- [ ] Home page loads in <2s on 3G.
- [ ] Displays correct cohort context (week, track).
- [ ] Primary CTA links to the highest-priority pending action.
- [ ] Announcements section shows latest posts.

### 6.2 Community Directory & Showcase

- **Directory:** cohort-scoped for learners (see own cohort members). Admins/mentors see all. Fields: name, avatar, bio, track. Filterable by track.
- **Showcase:** global across all cohorts. Gallery of passed deliverables (title, thumbnail/link, author, cohort). Visible to all roles.
- **Discord link:** persistent, prominent link to external community.

**Acceptance Criteria:**
- [ ] Directory shows all members of learner's cohort (learner view) or all members (admin view).
- [ ] Showcase displays passed deliverables with attribution.
- [ ] Alumni appear in directory and retain showcase entries.
- [ ] Discord link visible on Community page.

### 6.3 Announcements

- Admin posts global announcements; mentor posts cohort-scoped.
- Displayed on Home and a dedicated section.
- Email notification for global announcements.

### 6.4 Notifications

- In-app notification indicators (unread count).
- Email notifications (via Resend) for: new workshop, deliverable reviewed, global announcement.
- Learner can view notification history in-app.

### 6.5 Certificate

- Auto-generated when all modules are complete + all reviewed-type missions are passed.
- Decorative PDF with learner name, track, cohort, completion date.
- Shareable URL that renders certificate view (publicly accessible, no auth required).
- Accessible from learner profile permanently.

---

## 7. Roles & RBAC

Enforce via Supabase row-level security. Per-cohort scoping on all learner/mentor data.

| Capability | Learner | Mentor | Admin | Alumni |
|---|---|---|---|---|
| Signup via invite | yes | assigned by admin | created manually | role transition |
| View Home / own cohort | own | assigned | all | archived |
| Consume modules / resources | yes | yes | yes | yes |
| Submit missions / deliverables | yes | — | on behalf | — |
| Review deliverables | — | assigned cohort | all | — |
| Create/manage workshops | — | yes | yes | — |
| See others' work | cohort showcase | assigned cohort | all | showcase |
| Community directory / showcase | yes | yes | yes | yes |
| Post announcements | — | cohort-scoped | global | — |
| Create / edit content | — | propose (via repo PR) | yes (repo + admin panel) | — |
| Manage cohorts / invites | — | — | yes | — |
| Manage users / roles | — | — | yes | — |
| Retain portfolio forever | yes | — | — | yes |
| Generate invite links | — | — | yes | — |

---

## 8. Design & UX Constraints (from discovery)

- **Premium through restraint:** Linear/Vercel/Stripe-tier. No bootcamp/edtech aesthetics.
- **Bitcoin-only:** no crypto/web3 signifiers. Bitcoin orange used sparingly.
- **Mobile-first:** design at ~390px, single-column, thumb-friendly nav. Desktop is enhancement.
- **Low-data:** text-led, AVIF/WebP lazy images, no autoplay, no decorative video, SSR, minimal JS.
- **Top-level nav:** Home · Learn · Missions · Live · Resources · Community.
- **Resilient:** PWA service worker caches app shell + reading materials. Progress writes optimistically, syncs on reconnect.
