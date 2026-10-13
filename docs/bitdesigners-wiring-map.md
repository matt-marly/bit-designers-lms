# BitDesigners Africa — Navigation Wiring & Edge Case Map
> Use this as the source of truth for Stage 11 wiring pass.
> Every button, link, and action in the app. Every edge case per flow.

---

## 1. LEARNER FLOWS

### 1.1 Home `/home`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Live session banner | Click "View details →" | `/live` | Soonest session for the viewer's cohort that hasn't ended. None → banner hidden entirely |
| Live session banner | Click "Join now →" (live state) | External meeting URL, new tab | Live from 15 minutes before the start until the end |
| Certificate banner | Click "View certificate →" | `/certificates/[code]` | Shown only once the learner has a certificate for the selected track |
| UP NEXT card | Click "Continue learning" / "Start lesson" | `/learn/[moduleSlug]/[lessonSlug]` (first unfinished lesson of the first unfinished module) | Everything done → "You're all caught up"; nothing published → "Nothing to learn yet" |
| UP NEXT card | Click "Open mission" | `/missions/[missionSlug]` | Shown instead of the lesson button when the module's lessons are done but a mission isn't |
| UP NEXT card | Click "View syllabus" | `/learn` | — |
| MISSIONS stat | Visual only | — | Missions done out of the total, plus how many are waiting for review |
| CURRENT MISSION card | Click "Open mission" / "Revise and resubmit" | `/missions/[missionSlug]` | Picks needs-revision work first, then the not-started mission due soonest. Nothing to do → "N waiting for review", "All missions done" or "No missions yet" |
| CURRENT MISSION card | Click "All missions" | `/missions` | — |
| Module Progress | Click "View all modules →" | `/learn` | — |
| Module Progress unit row | Click to expand | Expands inline | — |
| Announcements row | Click | Expands inline to the full Markdown message | Global posts plus the viewer's cohort, newest first. None → "No announcements yet" |
| Notification bell | Click | `/notifications` | Badge shows unread count, "99+" above 99 |
| Nav: Home | Click | `/home` | — |
| Nav: Learn | Click | `/learn` | — |
| Nav: Missions | Click | `/missions` | — |
| Nav: Live | Click | `/live` | — |
| Nav: Materials | Click | `/materials` | — |
| Nav: Reference | Click | `/reference` | — |
| Nav: Community | Click | `/community` | — |
| Nav: Search | Click or ⌘K | Opens command palette | — |
| Nav: Admin link | Click (admin only) | `/admin` | Hidden for learner/alumni role |
| User avatar/name | Click | `/profile` | — |

---

### 1.2 Learn `/learn`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Track chips | Click | Switches track (remembered on this device) | Only shown when the user can see more than one track; student tracks come first |
| Unit header | Click | Toggles unit open/closed | The unit holding the first unfinished module starts open |
| Module card | Click | `/learn/[moduleSlug]` | Drafts only appear for curriculum editors, with a DRAFT pill and dashed border |
| Progress bar | Visual only | — | Counts published modules only |
| "2 OF 18 MODULES COMPLETE" | Visual only | — | No published modules → bar hidden, "No modules yet" message |

---

### 1.3 Module Page `/learn/[moduleSlug]`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "← All modules" back link | Click | `/learn` | — |
| "Start module" / "Continue" / "Review module" | Click | `/learn/[moduleSlug]/[lessonSlug]` (first unfinished lesson) | Module complete → goes to the first lesson |
| Lesson row | Click | `/learn/[moduleSlug]/[lessonSlug]` | Completed lessons show a green check; the next lesson is highlighted |
| Advisory note | Link to previous module | `/learn/[prevModuleSlug]` | Shown only when the previous module isn't finished and this one isn't started. Soft gate, never blocks |
| Mission row | Click | `/missions/[missionSlug]` | Section hidden when the module has no missions. The progress label reads "Lessons done · N missions left" until they're satisfied |
| Bottom nav: previous / next module | Click | `/learn/[slug]` | First or last module → that side is empty |

**Edge cases:**
- Slug doesn't exist, is a draft, or is in a track the user can't see → "Module not found" with a link back to Learn
- Draft module viewed by an editor → amber "This module is a draft" note

### 1.3b Lesson Page `/learn/[moduleSlug]/[lessonSlug]`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Sticky bar: module name | Click | `/learn/[moduleSlug]` | — |
| Video | Play | YouTube/Vimeo play inline | Other links → "Watch the video" opens in a new tab; no link → no video area |
| Transcript | Click | Expands inline | Hidden when there's no transcript |
| "Mark lesson complete" | Click | Marks the lesson done; finishing the last lesson completes the module once its missions are satisfied | Click again to mark not done, which reopens the module |
| Module finished banner | Link | Next module, or `/learn` if it was the last | All lessons done but a mission isn't → "N missions left" banner linking to the first one |
| Bottom nav: previous / next | Click | Previous or next lesson; after the last lesson, the next module | — |

**Edge cases:**
- Lesson slug doesn't exist → "Lesson not found" with a link back to the module

---

### 1.4 Missions `/missions`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Track chips | Click | Switches track (shared with Learn) | Only shown when the user can see more than one track |
| Filter: All / To do / Done | Click | Filters the grid | Nothing to do → "You're all caught up"; no missions → "No missions yet" |
| Mission card | Click | `/missions/[missionSlug]` | Only missions in published modules are listed |
| Status | Visual only | — | Not started, Waiting for review, In review, Needs revision, Passed (or Submitted for completion-only) |
| Deadline text | Visual only | — | Comes from the learner's cohort. Past due with nothing that counts → "Overdue" in red; late work → LATE flag |

**Edge cases:**
- Staff and platform roles without an enrollment see the list with a note that only students can submit

---

### 1.5 Mission Detail `/missions/[missionSlug]`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "← Missions" back link | Click | `/missions` | — |
| Previous / next mission | Click | `/missions/[slug]` | First or last mission → that side is empty |
| Rubric | Visual only | Criteria reviewers check | Hidden when the rubric is empty |
| Link field | Type URL | Checked on submit | Missing or not http/https → inline error, nothing saved |
| File picker | Select file | Uploaded to Convex storage on submit | Over 10 MB or not PDF/PNG/JPG/WebP → inline error. A file the server rejects is deleted |
| "Submit" / "Submit version N" | Click | Submits, toast, history updates | Reviewed mission waiting or in review → form replaced by a status message. Passed → "Your work passed" |
| Submission history | Visual only | Every version with its review, rubric checks, file link and LATE flag | No history → hidden |

**Edge cases:**
- Mission doesn't exist, is in a draft module, or is in a track the user can't see → "Mission not found"
- Draft module viewed by an editor → amber draft note; can't be submitted
- Completion-only mission → no review, counts as done straight away, and can be updated any time
- Late submission → accepted, flagged LATE

---

### 1.6 Live `/live`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Tab: Upcoming | Click | Shows upcoming sessions | No upcoming → "No sessions scheduled yet" empty state |
| Tab: Recordings | Click | Shows past sessions | No past sessions → "No recordings yet" empty state |
| Session time | Visual only | Viewer's local time | Host's time zone shown too when it differs |
| Upcoming session: "Add to calendar" | Click | Downloads .ics file (UTC times) | — |
| Upcoming session: "Join" (live) | Click | Opens meeting URL in new tab | Enabled from 15 minutes before the start |
| Linked module | Click | `/learn/[moduleSlug]` | Hidden when no module is linked, or for learners when it's a draft |
| Past session: "Watch recording" | Click | Opens modal with YouTube/Vimeo embed | Other links open in a new tab. No recording → "Recording coming soon" |
| Recording modal: close | Click X or backdrop | Closes modal | — |
| Staff | — | See every cohort's sessions in the track | Learners see only their cohort's |

---

### 1.7 Materials `/materials`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Accordion group | Click header | Expands/collapses group | Sections come from `RESOURCE_CATEGORIES`; empty sections are hidden |
| Resource row: link type | Click | Opens URL in new tab | — |
| Resource row: PDF type | Click | Opens the uploaded PDF in a new tab | — |
| Search input | Type | Filters resources live | No results → "No materials match your search" |
| ⌘K | Press | Opens command palette | Searches modules, missions, materials and reference |
| — | — | — | Entries are global or limited to one track (Admin → Resources). Nothing added → "No materials have been added yet" |

---

### 1.8 Reference `/reference`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Theme filter pill | Click | Filters video library | No results → "No videos in this category" |
| Video card | Click | Opens YouTube/Vimeo embed modal | Other links open in a new tab |
| Modal: close | Click X | Closes modal | — |
| — | — | — | Nothing added → "No reference videos have been added yet" |

---

### 1.9 Community `/community`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Discord card | Click | Opens Discord invite URL, new tab | — |
| Twitter card | Click | Opens Twitter URL, new tab | — |
| WhatsApp card | Click | Opens WhatsApp group URL, new tab | — |
| LinkedIn card | Click | Opens LinkedIn URL, new tab | — |
| Your cohort | Visual | Members with avatar, bio and portfolio | Learners see their own cohort; staff see every cohort in the track. Emails are never shown |
| Member portfolio link | Click | Opens URL in new tab | Hidden when not set |
| Mentors | Visual | Lead mentors first, then co-mentors | Section hidden when the track has no staff |
| Showcase card | Click | Opens the submitted work link in a new tab | Passed work on reviewed missions only; learners who opted out are hidden. None → "Nothing here yet" |

---

### 1.10 Profile `/profile`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Avatar: "Upload photo" | Select file | Uploads to Convex storage | Not PNG/JPG/WebP or over 2 MB → error toast, file discarded |
| Avatar: "Remove" | Click | Clears the photo, deletes the file | — |
| About: "Save" | Click | Saves name, bio (600 chars), portfolio link | Empty name or non-http(s) link → error toast |
| "Show my passed missions in the Community showcase" | Checkbox | Saved with the About form | On by default |
| Certificates | Click a row | `/certificates/[code]` | Card hidden until the first certificate |
| Progress | Visual | Modules and missions done, recent work | Learners and alumni only |
| Recent work row | Click | `/missions/[missionSlug]` | None → "Nothing submitted yet" |

---

### 1.11 Notifications `/notifications`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Notification row | Click | Marks it read and follows its link | Types: review, workshop, announcement, certificate |
| "Mark all as read" | Click | Marks everything read (in batches on the server) | Hidden when nothing is unread |
| "Load more" | Click | Next page | Hidden at the end. None → "You're all caught up" |

---

### 1.12 Welcome `/welcome`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "Go to my dashboard" / "Skip" | Click | Records onboarding, `/home` | Shown once: dashboard pages send people here until onboarding is recorded |
| "Set up my profile" | Click | Records onboarding, `/profile` | — |

---

### 1.13 Certificate `/certificates/[code]` (public)

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "Download PDF" | Click | Browser print dialog, A4 landscape, toolbar hidden | — |
| "Copy link" | Click | Copies the page URL | Shows "Link copied" for 2 seconds |
| — | — | — | No sign-in needed. Unknown code → "Certificate not found". Shows only name, track, cohort, date and code |

---

## 2. ADMIN FLOWS

### 2.1 Overview `/admin`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "Invite learner" button | Click | `/admin/invites` | Hidden without invite permission |
| Quick action: Invite learners | Click | `/admin/invites` | Each quick action is shown only with the matching permission |
| Quick action: Review queue | Click | `/admin/review` | Shows how many are waiting; amber when any are |
| Quick action: Post an announcement | Click | `/admin/announcements` | — |
| Quick action: Live sessions | Click | `/admin/sessions` | Shows the next scheduled session |
| Waiting longest: "Review" button | Click | `/admin/review` | Oldest waiting first. None → "Nothing is waiting for review" |
| Stat cards | Visual only | — | Active learners, waiting for review, submitted and reviewed in the last 7 days, across the tracks the viewer staffs. Counts above 100 show "100+" |

---

### 2.2 Tracks `/admin/tracks`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "New track" button | Click | Inline form → `tracks.create` | Only with `tracks.manage`; duplicate names are rejected |
| Track card | Click | Shows that track's detail below | Archived tracks only appear for `tracks.manage` |
| "Edit" / "Archive" / "Restore track" | Click | `tracks.update` | Archive asks for confirmation |
| "New cohort" / cohort "Edit" | Click | Inline form → `tracks.createCohort` / `tracks.updateCohort` | Needs `track.cohorts`; end date must be after start |
| "N students" | Click | Expands the paginated student list (`tracks.listCohortStudents`) | — |
| "Add a student" | Submit email | `invitations.create` with a student grant | Existing members join at once; others get an invite email |
| Student "Move to…" / "Remove" | Select / click | `tracks.moveStudent` / `tracks.unenroll` | Remove asks for confirmation |
| "Add mentor" | Submit email | `invitations.create` with a lead or co-mentor grant | Lead needs `tracks.manage`; co-mentor needs `tracks.manage` or being the lead |
| Mentor "Permissions" / "Make lead" / "Remove" | Click | `tracks.setCoMentorPermissions` / `tracks.setLead` / `tracks.removeMember` | Making someone lead turns the old lead into a co-mentor |

---

### 2.2b Curriculum `/admin/curriculum`

Visible with `content.manage`, or `track.content` on at least one track. `?track=` and `?module=` keep the selected track and open module in the URL.

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Track chips | Click | Switches the outline | Only shown when the editor has more than one active track |
| "+ Add unit" / "Add module" / "Add lesson" | Submit title | `curriculumEditor.createUnit` / `createModule` / `createLesson` | New modules start as drafts and open automatically |
| Unit or module arrows | Click | `moveUnit` / `moveModule` / `moveLesson` | Disabled at the top and bottom |
| Unit rename / delete | Click | `updateUnit` / `deleteUnit` | Delete is disabled until the unit has no modules; asks for confirmation |
| Module row | Click | Expands details, lessons and actions | — |
| "Save module" | Click | `updateModule` (title, description, objectives) | Shown only when something changed |
| "Publish" / "Unpublish" | Click | `setModuleStatus` | Publish is disabled until the module has a lesson |
| Lesson title / pencil | Click | `/admin/curriculum/lessons/[lessonId]` | Lessons with no text show "Empty" in amber |
| Lesson delete | Click | `deleteLesson` | Confirms; warns when it's the last lesson of a published module (the module goes back to draft) |
| Module delete | Click | `deleteModule` | Disabled until the module has no lessons or missions |
| "Preview as learner" | Click | `/learn/[moduleSlug]` in a new tab | Hidden when the module has no lessons |
| "Add mission" | Submit title | `missionsEditor.createMission`, then opens the mission editor | Reviewed by default. Up to 10 per module |
| Mission row arrows / edit / delete | Click | `moveMission` / mission editor / `deleteMission` | Delete confirms, and is refused once anyone has submitted. Missions without a brief show "No brief" in amber |

**Lesson editor** `/admin/curriculum/lessons/[lessonId]`: title, video link, summary, Markdown body with Write/Preview tabs and a character count, and an optional transcript. A save bar appears when there are unsaved changes (⌘S / Ctrl+S saves). Leaving with unsaved changes asks for confirmation. A deleted lesson, or one the user can't edit, shows a message with a link back.

**Mission editor** `/admin/curriculum/missions/[missionId]`: title, review type ("Reviewed by a mentor" or "Done on submit"), Markdown brief, and a rubric list (add, reorder, remove; up to 12 criteria). Text changes use the same save bar as lessons. The Deadlines table lists every cohort that isn't archived; picking a date saves straight away as the end of that day, with a Clear button and a "Week N" hint.

---

### 2.3 Members `/admin/members`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Search input | Type | Filters members live | No results → "No members match your search" |
| Track filter: All | Click | Shows all members | — |
| Track filter: Design Lab | Click | Shows Design Lab members only | No members in track → empty state |
| Track filter: Open Source Lab | Click | Shows OSL members only | — |
| Member row: portfolio link | Click | Opens portfolio URL in new tab | No URL → icon hidden |
| Member row: GitHub link | Click | Opens GitHub URL in new tab | No URL → icon hidden |
| Member row | Click (future) | Member detail (V2) | — |

---

### 2.4 Invites `/admin/invites`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Track segmented control | Click | Selects track | — |
| Cohort select | Change | Updates cohort selection | No cohorts → "No cohorts available" option disabled |
| Usage limit input | Type | Sets limit | 0 or negative → validate, show error |
| "Generate Invite Link" button | Click | Generates code, shows result below form | Generation fails → error toast |
| Generated code: "Copy Link" | Click | Copies full URL to clipboard | Clipboard API fails → show URL to copy manually |
| Active invite: "Copy" | Click | Copies invite URL to clipboard | — |
| Active invite: "Deactivate" | Click | Deactivates invite, confirms first | Confirmation: "Deactivate this invite? Learners with the link won't be able to sign up." |
| Deactivated invite | Visual | Shows as greyed out row | — |

---

### 2.5 Review Queue `/admin/review`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
Visible with `reviews.manage`, or `track.reviews` on at least one track. The nav badge shows how many submissions are waiting (hidden at 0). `?tab=` and `?track=` keep the selection in the URL.

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Track chips | Click | "All tracks" or one track | Only shown when the reviewer can review more than one track |
| Tab: To review / In review / Reviewed | Click | `reviews.queue` | Waiting work is oldest first; reviewed is newest first; up to 50 per tab. Empty → "You're all caught up." |
| Submission link / file | Click | Opens in a new tab | File link is a signed Convex storage URL |
| "Earlier versions" | Click | `reviews.history` | Hidden on version 1 |
| "Start review" | Click | `reviews.startReview` (claims it) | Someone else already on it → "X is reviewing this" with "Review anyway" |
| Rubric checkboxes | Click | Saved with the review | Hidden when the mission has no rubric |
| "Pass" / "Needs revision" | Click | Selects the outcome | Outline style; selected state uses green or amber tint |
| Comment | Type | Required | Empty → "Send review" stays disabled |
| "Send review" | Click | `reviews.review`, toast, card moves to Reviewed | Error → toast, form kept |

**Edge cases:**
- Your own submission (staff who are also enrolled) → shown with a notice, no review form
- Completion-only work never enters the queue

**Pass/Needs Revision button treatment fix:**
These should NOT be colored fill buttons. Use outline style:
- Pass: outline button, on select → bg rgba(34,197,94,0.10), border rgba(34,197,94,0.30), color #4ADE80
- Needs Revision: outline button, on select → bg rgba(245,158,11,0.10), border rgba(245,158,11,0.30), color #F59E0B
- Unselected: bg transparent, border #333333, color #737373

---

### 2.6 Announcements `/admin/announcements`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Audience select | Change | Everyone, or one cohort | "Everyone" needs `announcements.global`; cohorts need `track.announcements`. Ended cohorts are marked "(ended)"; archived cohorts are rejected |
| Title input | Type | — | Required, 120 characters |
| Message textarea | Type | Markdown with Write / Preview | Required, 5,000 characters |
| "Publish" button | Click | Publishes, notifies the audience (not the author), success toast | Disabled until title and message are filled. Fails → error toast |
| Published row | Click | Expands the full message | — |
| Published row: "Delete" | Click | Confirms first, then removes | Only the author or someone who could post to that audience |

---

### 2.7 Sessions `/admin/sessions`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Cohort select | Change | Cohorts grouped by track | Only tracks where the viewer has `track.workshops`; ended cohorts aren't offered |
| Title / description / host | Type | — | Title required (120 characters) |
| Date and time inputs | Type | Interpreted in the viewer's time zone | Stored as UTC with the time zone name |
| Duration | Change | 15–480 minutes | — |
| Module select | Change | Optional link to a module of the same track | — |
| Meeting link input | Type | — | Required, http(s) only |
| "Schedule session" button | Click | Adds to Upcoming, notifies the cohort, success toast | Disabled until title, date, time and link are filled |
| Session row: "Edit" | Click | Opens the form with the session's values | — |
| Session row: "Cancel" | Click | Confirms first, then deletes the session | — |
| Past session: "Add recording" / "Edit" / "Remove" | Click | Saves a recording link | YouTube or Vimeo links only |

---

### 2.8 Resources `/admin/resources`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Materials / Reference tabs | Click | Switches list and form | Requires `resources.manage` |
| Section select | Change | — | Sections differ for Materials and Reference |
| "Shown in" select | Change | Every track, or one track | — |
| Format (Materials only) | Change | Link or PDF | Reference entries are always links |
| PDF picker | Select file | Uploads to Convex storage | Not a PDF or over 20 MB → error, file discarded |
| "Add" / "Save" | Click | Saves, success toast | Title required; links must be http(s) |
| Row: up / down | Click | Reorders within the section | — |
| Row: "Delete" | Click | Confirms first, removes it (and its PDF) | — |

---

## 3. GLOBAL EDGE CASES

| Scenario | Handling |
|---|---|
| User not logged in, visits any `/home` or `/learn` route | Redirect to `/login` |
| User not logged in, visits any `/admin` route | Redirect to `/login` |
| Learner visits `/admin` route | Redirect to `/home` with toast "Access denied" |
| Invalid route / 404 | Custom 404 page with "Go home" CTA |
| Network error on any data fetch | Error state with "Something went wrong. Try again." + retry button |
| Session expired | Redirect to `/login` with toast "Your session expired. Please log in again." |
| Invite link invalid/expired | `/accept-invite` shows an error state |
| First login (not onboarded) | Dashboard pages redirect to `/welcome` until it's completed or skipped |
| Alumni (cohort completed or archived) visits a mission | Can read everything; submitting is replaced by "Your cohort has ended. Your work is preserved here, but you can't submit new versions." Labeled "Alumni" on the profile |
| Signed-out visitor opens `/certificates/[code]` | Allowed; certificates are public |

---

## 4. EMPTY STATES (all pages)

| Page | Empty State Message |
|---|---|
| `/learn` | "No modules yet". Editors get a link to Admin → Curriculum |
| `/missions` | "No missions yet" — "Your mentors haven't published any missions for this track." |
| `/missions` To do filter | "You're all caught up" — "Nothing left to hand in right now." |
| `/live` Upcoming tab | "No sessions scheduled yet. Check back soon." |
| `/live` Recordings tab | "No recordings yet." |
| `/materials` search | "No materials match your search." |
| `/materials` nothing added | "No materials have been added yet." |
| `/reference` filter | "No videos in this category." |
| `/reference` nothing added | "No reference videos have been added yet." |
| `/community` showcase | "Nothing here yet. Passed missions will appear as reviews come in." |
| `/notifications` | "You're all caught up." |
| `/admin` waiting longest | "Nothing is waiting for review." |
| `/admin/review` To review tab | "You're all caught up." |
| `/admin/members` search | "No members match your search." |
| `/admin/sessions` list | "No sessions scheduled. Create your first session above." |
| `/admin/announcements` list | "No announcements published yet." |

---

## 5. TOAST NOTIFICATIONS

| Trigger | Toast | Type |
|---|---|---|
| Module marked complete | "Module complete" | Success |
| Mission submitted | "Submitted. Your mentors will review it." (reviewed), "Submitted. This mission is done." (completion-only), or "Submitted. That finishes the module." | Success |
| Review sent | "Passed [name]'s work" or "Sent back to [name] for revision" | Success |
| Invite link generated | "Invite link created" | Success |
| Invite link copied | "Copied to clipboard" | Success |
| Invite deactivated | "Invite deactivated" | Success |
| Announcement published | "Announcement published" | Success |
| Session scheduled | "Session scheduled" | Success |
| Profile saved | "Profile updated" | Success |
| Any form error | Specific error message | Error |
| Network error | "Something went wrong. Try again." | Error |
| Session expired | "Session expired. Please log in." | Warning |
---

## 6. WIRING PRIORITY ORDER FOR STAGE 11

Do in this order — navigation first, then states:

1. Wire all nav links (already mostly done via Next.js Link)
2. Wire all "back" links on detail pages
3. Wire all CTA buttons to correct destinations
4. Wire admin quick action links
5. Build Pass/Needs Revision button treatment fix on review queue
6. Build empty states (all pages)
7. Build toast notification system
8. Build error states
9. Build disabled/loading states on forms
10. Mobile responsive pass
