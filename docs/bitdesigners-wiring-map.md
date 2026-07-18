# BitDesigners Africa — Navigation Wiring & Edge Case Map
> Use this as the source of truth for Stage 11 wiring pass.
> Every button, link, and action in the app. Every edge case per flow.

---

## 1. LEARNER FLOWS

### 1.1 Home `/home`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Live session banner | Click "View details →" | `/live` | No upcoming session → banner hidden entirely |
| Live session banner | Click "Join now →" (live state) | External meeting URL, new tab | No meeting URL set → show "Link not available yet" |
| UP NEXT card | Click "Continue learning" | `/learn/[moduleSlug]` | No in-progress module → show first incomplete module |
| UP NEXT card | Click "View syllabus" | `/learn` | — |
| CURRENT MISSION card | Click "Submit deliverable" | `/missions/[missionSlug]` scroll to submission form | No active mission → card hidden, show "No active missions" |
| CURRENT MISSION card | Click "Mission brief" | `/missions/[missionSlug]` | — |
| Module Progress | Click "View all modules →" | `/learn` | — |
| Module Progress unit row | Click to expand | Expands inline | — |
| Announcements row | Click | No destination (V1 — announcements are read-only) | No announcements → show empty state "No announcements yet" |
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
| Unit header | Click | Toggles unit open/closed | All complete → collapsed by default |
| Module card (any status) | Click | `/learn/[moduleSlug]` | Locked module → show advisory warning, still navigable |
| Module card (NOT STARTED, gated) | Click | `/learn/[moduleSlug]` with advisory banner | "COMPLETE PREVIOUS MODULE FIRST" — soft gate only, not hard blocked |
| Progress bar | Visual only | — | 0% → empty bar still renders |
| "2 OF 18 MODULES COMPLETE" | Visual only | — | 0 complete → "0 OF 18 MODULES COMPLETE" |

---

### 1.3 Lesson Page `/learn/[moduleSlug]`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "← Learn" back link | Click | `/learn` | — |
| YouTube embed | Play | Plays inline | No video URL → hide video zone, show text content only |
| "HIDE VIDEO" toggle | Click | Toggles video visibility | — |
| Tab: Overview | Click | Shows overview tab | Default active tab on load |
| Tab: Lesson | Click | Shows lesson content | — |
| Tab: Resources | Click | Shows resources list | No resources → "No resources for this lesson" |
| Tab: Sessions | Click | Shows related sessions | No sessions → "No sessions scheduled" |
| Tab: Questions | Click | Shows quiz/questions | No questions → hide tab entirely |
| Right panel: lesson row | Click | Navigates to that lesson within module | Current lesson → highlighted, no navigation |
| Right panel: chevron | Click | Collapses/expands right panel | — |
| "Mark complete" button | Click | Marks module complete, shows success state | Already complete → button shows "Completed ✓", disabled |
| "Mark complete" button | Click (has mission) | Marks complete + prompts to submit mission | Mission already submitted → skip prompt |
| Bottom nav: "← Previous" | Click | `/learn/[prevModuleSlug]` | First module → button hidden |
| Bottom nav: "Next →" | Click | `/learn/[nextModuleSlug]` | Last module → button shows "You've finished this unit" |
| Advisory banner (gated) | Visual only | — | Shows only if Labs module accessed before Foundations complete |

**Edge cases:**
- Module has no lessons → redirect to `/learn` with error toast
- Module slug doesn't exist → 404 page
- Video URL is invalid → hide embed, show "Video unavailable" message

---

### 1.4 Missions `/missions`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Tab: All | Click | Shows all missions | — |
| Tab: Pending | Click | Shows pending/needs-revision missions | No pending → "You're all caught up" empty state |
| Tab: Passed | Click | Shows passed missions | No passed → "No passed missions yet" |
| Mission card | Click | `/missions/[missionSlug]` | — |
| Status pill | Visual only | — | — |
| Deadline text | Visual only | — | Past deadline → "OVERDUE" in danger color |

---

### 1.5 Mission Detail `/missions/[missionSlug]`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "← Missions" back link | Click | `/missions` | — |
| "View Rubric" toggle | Click | Expands rubric inline | No rubric → hide toggle |
| Submission link input | Type URL | Validates URL format | Empty → show "Link is required" error |
| File upload | Select file | Uploads to R2 (V1: mock) | File > 10MB → "File must be under 10MB" error |
| File upload | Select wrong type | — | Non PDF/image → "Only PDF or image files accepted" |
| "Submit deliverable" button | Click | Submits, shows success state | Already submitted (in review) → button disabled, "Awaiting review" |
| "Submit deliverable" button | Click (needs revision) | Resubmit flow, version increments | — |
| Submission history | Visual only | Shows all previous versions | No history → hidden |
| "Open in Figma" / link | Click | Opens submission URL in new tab | Invalid URL → show error toast |

**Edge cases:**
- Mission doesn't exist → 404
- Mission not yet active for cohort → "This mission isn't open yet"
- Completion-only mission → no review, status flips to "Submitted" immediately
- Late submission → accepted, flagged with "LATE" badge

---

### 1.6 Live `/live`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Tab: Upcoming | Click | Shows upcoming sessions | No upcoming → "No sessions scheduled yet" empty state |
| Tab: Recordings | Click | Shows recorded sessions | No recordings → "No recordings yet" empty state |
| Upcoming session: "Add to calendar" | Click | Downloads .ics file | No meeting URL → button hidden |
| Upcoming session: "Join" (live) | Click | Opens meeting URL in new tab | No URL → disabled button "Link not available" |
| Countdown timer | Visual only | Counts down to session | Past session → removed from upcoming list |
| Recording card: "Watch recording" | Click | Opens modal with YouTube embed | No recording URL → "Recording coming soon" |
| Recording modal: close | Click X or backdrop | Closes modal | — |

---

### 1.7 Materials `/materials`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Accordion group | Click header | Expands/collapses group | All collapsed by default |
| Resource row: link type | Click | Opens URL in new tab | Broken URL → still opens (external) |
| Resource row: PDF type | Click | Opens PDF in new tab or downloads | — |
| Search input | Type | Filters resources live | No results → "No materials match your search" |
| ⌘K | Press | Opens command palette | — |

---

### 1.8 Reference `/reference`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Theme filter pill | Click | Filters video library | No results → "No videos in this category" |
| Video card | Click | Opens YouTube embed modal | — |
| Modal: close | Click X | Closes modal | — |

---

### 1.9 Community `/community`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Discord card | Click | Opens Discord invite URL, new tab | — |
| Twitter card | Click | Opens Twitter URL, new tab | — |
| WhatsApp card | Click | Opens WhatsApp group URL, new tab | — |
| LinkedIn card | Click | Opens LinkedIn URL, new tab | — |

---

### 1.10 Profile `/profile`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "Edit profile" | Click | Enables inline editing | — |
| Avatar upload | Select file | Uploads to R2 | File too large → error |
| "Save changes" | Click | Saves profile, success toast | Empty required fields → inline validation errors |
| "Cancel" | Click | Discards changes | — |
| Portfolio URL | Click (view mode) | Opens URL in new tab | No URL set → hidden |

---

## 2. ADMIN FLOWS

### 2.1 Overview `/admin`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "Invite Learner" button | Click | `/admin/invites` | — |
| Quick action: Generate Invite Link | Click | `/admin/invites` | — |
| Quick action: Review Queue | Click | `/admin/review` | — |
| Quick action: Post Announcement | Click | `/admin/announcements` | — |
| Recent submission: "Review" button | Click | `/admin/review` scrolled to submission | No submissions → "No recent submissions" empty state |
| Stat cards | Visual only | — | All zeros on fresh cohort |

---

### 2.2 Cohorts `/admin/cohorts`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| "New Cohort" button | Click | Disabled (V2) — tooltip "Coming in V2" | — |
| "View Learners" button | Click | `/admin/members` | — |
| "View Missions" button | Click | `/admin/review` | — |
| "Manage" button | Click | `/admin/cohorts/[cohortId]` (V2) | Currently no detail page — show toast "Coming in V2" |
| Progress bar | Visual only | — | 0% → empty bar |

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
| Tab: All | Click | Shows all submissions | — |
| Tab: Pending | Click | Shows pending only | No pending → "No submissions pending review" |
| Tab: Reviewed | Click | Shows reviewed submissions | — |
| "Open in Figma" | Click | Opens submission link in new tab | Invalid URL → error toast |
| "View Rubric" | Click | Expands rubric inline | No rubric → hide toggle |
| "Pass" button | Click | Selects Pass outcome, enables Submit | — |
| "Needs Revision" button | Click | Selects Needs Revision, enables Submit | — |
| Feedback textarea | Type | Required for submission | Empty on submit → "Feedback is required" inline error |
| "Submit Review" button | Click | Submits review, success toast, row updates | Submission fails → error toast, keep form state |
| "Submit Review" button | Click (no outcome selected) | Disabled state | — |

**Pass/Needs Revision button treatment fix:**
These should NOT be colored fill buttons. Use outline style:
- Pass: outline button, on select → bg rgba(34,197,94,0.10), border rgba(34,197,94,0.30), color #4ADE80
- Needs Revision: outline button, on select → bg rgba(245,158,11,0.10), border rgba(245,158,11,0.30), color #F59E0B
- Unselected: bg transparent, border #333333, color #737373

---

### 2.6 Announcements `/admin/announcements`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Title input | Type | — | Empty on submit → "Title is required" |
| Message textarea | Type | — | Empty on submit → "Message is required" |
| Send to: segmented control | Click | Selects scope | — |
| "Publish Announcement" button | Click | Publishes, success toast, appears in list | Fails → error toast |
| "Publish Announcement" button | Click (empty fields) | Disabled or inline errors | — |
| Published row: "..." menu | Click | Shows Edit / Delete options | — |
| Delete announcement | Click | Confirms first, then removes | — |

---

### 2.7 Sessions `/admin/sessions`

| Element | Action | Destination | Edge Cases |
|---|---|---|---|
| Title input | Type | — | Empty on submit → "Title is required" |
| Date input | Type | — | Past date → allow but show warning "This date is in the past" |
| Time input | Type | — | Invalid time → inline error |
| Duration select | Change | — | — |
| Cohort select | Change | — | — |
| Meeting link input | Type | — | Empty on submit → "Meeting link is required" |
| "Schedule Session" button | Click (incomplete) | Disabled, helper "Fill in title, date, time, and meeting link" | — |
| "Schedule Session" button | Click (complete) | Adds to sessions list, success toast | — |
| Session row: "Edit" | Click | Opens edit form (V1: inline or modal) | — |
| Session row: "Cancel" | Click | Confirms first, removes from list | Confirmation: "Cancel this session? Enrolled learners will be notified." |
| Session row: "Add Recording" | Click | Opens input for YouTube URL | Invalid YouTube URL → "Please enter a valid YouTube URL" |

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
| Invite link invalid/expired | `/signup/[code]` shows error state "This invite link is invalid or has expired." |
| First login (profile not set up) | Redirect to `/setup-profile` before `/home` |
| Alumni visits submit/mission routes | Actions disabled, "Your cohort has ended. Your work is preserved in your profile." |

---

## 4. EMPTY STATES (all pages)

| Page | Empty State Message |
|---|---|
| `/learn` | "No modules available yet." (shouldn't happen in V1) |
| `/missions` | "No missions assigned to your cohort yet." |
| `/missions` Pending tab | "You're all caught up. No pending missions." |
| `/missions` Passed tab | "No passed missions yet. Keep going." |
| `/live` Upcoming tab | "No sessions scheduled yet. Check back soon." |
| `/live` Recordings tab | "No recordings yet." |
| `/materials` search | "No materials match your search." |
| `/reference` filter | "No videos in this category." |
| `/admin/review` Pending tab | "No submissions pending review." |
| `/admin/members` search | "No members match your search." |
| `/admin/sessions` list | "No sessions scheduled. Create your first session above." |
| `/admin/announcements` list | "No announcements published yet." |

---

## 5. TOAST NOTIFICATIONS

| Trigger | Toast | Type |
|---|---|---|
| Module marked complete | "Module complete" | Success |
| Mission submitted | "Deliverable submitted" | Success |
| Mission resubmitted | "Resubmission received" | Success |
| Review submitted | "Review submitted" | Success |
| Invite link generated | "Invite link created" | Success |
| Invite link copied | "Copied to clipboard" | Success |
| Invite deactivated | "Invite deactivated" | Success |
| Announcement published | "Announcement published" | Success |
| Session scheduled | "Session scheduled" | Success |
| Profile saved | "Profile updated" | Success |
| Any form error | Specific error message | Error |
| Network error | "Something went wrong. Try again." | Error |
| Session expired | "Session expired. Please log in." | Warning |
| Late submission | "Submitted — marked as late" | Warning |

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
