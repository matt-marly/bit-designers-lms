# BitDesigners Africa — Product Discovery & Decision Record

> Status: discovery resolved for V1. This is the source of truth for PRD + architecture.
> Legend: **[DECIDED]** locked for V1 · **[OPEN]** needs a call before/at PRD · **[V2+]** deferred.

---

## 1. Product

**What it is:** A learning-and-contribution platform for African designers entering the Bitcoin ecosystem. Long-term it is a **Contributor Operating System** (persistent: learn → contribute → build reputation → grow). **[DECIDED]**

**V1 metaphor:** ships as a familiar **LMS-shaped** experience, but the **data model is OS-ready** (contributions, deliverables, reputation are first-class entities from day one) to avoid a later migration. **[DECIDED]**

**Mission:** produce *contributors*, not graduates — designers who can learn Bitcoin from a product lens, build portfolio-worthy work, and produce implementation-ready contributions to Bitcoin OSS.

## 2. Brand & Experience Principles

- Serious, technical, modern, design-forward. The platform is itself a portfolio piece — craft bar is high. **[DECIDED]**
- **Bitcoin-only.** No crypto/altcoin/web3/meme signifiers in copy or visuals. Bitcoin orange used with restraint. **[DECIDED]**
- Clean, premium, contemporary (Linear/Vercel/Stripe-tier restraint). **Not** bootcamp/edtech — no mascots, confetti, streaks, badge-spam, heavy gamification. **[DECIDED]**
- Confident + professional, yet approachable to Bitcoin beginners. Approachability comes from clarity and onboarding, not a softer aesthetic. **[DECIDED]**
- **Premium through restraint:** the low-bandwidth constraint and the aesthetic align — typographic, fast, minimal imagery.

## 3. Users & Scale

- Primary users: Product / UX / UI / Visual designers + UX researchers. Design-literate; Bitcoin knowledge ranges beginner → already-working-in-Bitcoin. **[DECIDED]**
- Cohort size: **50–80 learners/cohort.** Small scale — richness problem, not a scale problem. **[DECIDED]**
- Language: **English only** (V1). **[DECIDED]**
- Auth: **email + password only** (V1). No OAuth/Nostr/Lightning. **[DECIDED]**

## 4. Roles & Permissions

Four roles defined now (schema OS-ready); mentor *features* stay light in V1. **[DECIDED]**

| Capability | Learner | Mentor | Admin | Alumni |
|---|---|---|---|---|
| View onboarding / own cohort | own | assigned | all | archived only |
| Consume modules / resources | ✅ | ✅ | ✅ | ✅ |
| Submit missions / deliverables | ✅ | — | on behalf | — |
| Review deliverables (pass / needs-revision + comment) | — | assigned cohort | all | — |
| Host / manage live workshops | — | ✅ | ✅ | — |
| See others' work | cohort showcase | assigned | all | showcase |
| Community directory / showcase | ✅ | ✅ | ✅ | ✅ |
| Post announcements | — | cohort-scoped | global | — |
| Create / edit content | — | propose | ✅ | — |
| Manage cohorts (create, enroll, dates) | — | — | ✅ | — |
| Manage users / roles | — | — | ✅ | — |
| Retain own portfolio forever | ✅ | — | — | ✅ |

- **Mentor (V1 meaning):** reviews deliverables + hosts workshops. Not a full 1:1 mentorship system. **[DECIDED]**
- **Alumni:** exists after cohort 1; read access to resources/directory/showcase + retained personal portfolio. Alumni→Mentor is a later role reassignment, no new system. **[DECIDED]**
- Enforce via row-level security (per-cohort scoping). **[DECIDED]**

## 5. V1 Scope

**In scope (the five pillars + thin connective tissue):** **[DECIDED]**
1. Applications → screening → acceptance → **cohort onboarding**
2. **Self-paced learning modules** (video + reading + assignment/deliverable)
3. **Weekly missions / deliverables**
4. **Live workshops / classes** (scheduling + links + recordings)
5. **Resource library**
- Plus (thin): student "next step" home, deliverable submission + review, community directory, portfolio showcase, announcements, notifications, certificate on completion.

**Deferred [V2+]:** sophisticated AI Mentor · human 1:1 mentorship system · rich reputation/contributor scoring · GitHub API integration · Bitcoin-native primitives (Nostr / Lightning / on-chain creds) · payments/bounties · peer review · numeric grading · multi-language · offline video.

## 6. Learning & Cohort Model

- **Hybrid:** content is **self-paced**; each **cohort** shares start date, milestones, deadlines, workshops, discussion. **[DECIDED]**
- Implication: two linked systems — per-learner module completion **and** per-cohort schedule/milestones.
- **[OPEN]** Missed cohort deadline = soft (fall behind, keep going) vs hard (locked/flagged). Resolve at PRD.
- **[OPEN]** Foundations→Labs gating: hard-gate vs advisory.
- **[OPEN]** "Weekly missions" vs module assignments — same thing or a separate recurring layer? Resolve at PRD (structural).

## 7. Labs (V1 responsibility)

Platform's job = help learners produce **implementation-ready outputs** (UX audits, design proposals, Figma deliverables, GitHub issues, contribution recommendations). It does **not** promise merged/shipped work (depends on external maintainers). **[DECIDED]**
- **Design Lab** output of record = a logged, portfolio-worthy artifact.
- **Open Source Lab** = same, plus a linked GitHub issue/proposal. GitHub *integration* not required in V1 — learners **link out** to issues they file. **[DECIDED]**

## 8. Deliverables & Review

- **Submission:** link-out first (Figma / GitHub URL) + optional file upload (PDF/image). Keeps storage light, matches designer tools. **[DECIDED]**
- **Review:** lightweight, two outcomes — **pass** / **needs-revision** + comment against a short rubric; by assigned mentor or admin; learner can resubmit. **[DECIDED]**
- Low-stakes missions = **completion-only** (no review) to cap review load. **[DECIDED]**
- No numeric grades, no peer review in V1. **[DECIDED]**
- **[OPEN]** Does mentor review every reviewed deliverable, or only capstone/flagged? (throughput at 50–80).

## 9. Information Architecture (V1)

- Login home = **"next step"** view: current cohort week, next module/mission, next deadline, next workshop, one primary CTA. LMS-shaped now, grows into an OS dashboard in V2 without rebuild. **[DECIDED]**
- **[OPEN]** Confirm top-level nav (proposed: Home · Learn · Missions · Live · Resources · Community). Resolve at PRD.
- Progress shown simply in V1 (module completion), multi-dimensional later. **[DECIDED]**

## 10. Access, Bandwidth & Offline (target: African, mobile-first)

- **Mobile-first:** design at ~390px, single-column, thumb nav; desktop is enhancement. **[DECIDED]**
- **Low-data:** text-led UI; AVIF/WebP lazy-loaded images; no autoplay/decorative video; every video ships a **transcript + summary** (data-free alternative + accessibility). SSR, minimal JS. **[DECIDED]**
- **Resilient, not offline-first:** PWA service worker caches app shell + reading materials + downloaded PDFs for offline reading; progress writes optimistically, syncs on reconnect. **Video not cached offline in V1.** **[DECIDED]**
- **Video:** adaptive-bitrate host (auto-drops quality), manual quality selector defaulting low on mobile; keep modules 5–10 min. Do not self-host video. **[DECIDED]**

## 11. Business Model & Team

- **Free to learners.** No payments/checkout in V1. Bounties/Lightning = **[V2+]**. **[DECIDED]**
- Funding assumed grant/sponsor-backed (confirm). **[OPEN]** Who pays infra costs / budget ceiling.
- Build assumption: **1–2 builders + Claude Code, ~8–12 weeks to first cohort.** **[OPEN — confirm]** — if different, V1 scope re-cuts.

## 12. Tech Stack **[DECIDED]**

Chosen for: minimal custom build, cheap at 50–80/cohort, scales without rewrite.

- **Next.js (App Router) + TypeScript** — full-stack, SSR for slow networks.
- **Tailwind CSS + shadcn/ui** — premium components fast, no bootcamp look.
- **Supabase** — Postgres + email/password auth + file storage + row-level security.
- **Cloudflare Stream** (adaptive video) + **R2** (files, no egress fees).
- **Resend** — transactional/cohort email.
- **Vercel** — hosting (free tier → scale).

All have free/near-free tiers at this scale; no hard lock-in.

## 13. Success Metrics **[OPEN — define before PRD sign-off]**

Placeholders to fill:
- Cohort-1 north star (the one number).
- Completion rate target.
- # implementation-ready contributions produced.
- Leading weekly indicators (active learners, deliverables submitted, workshop attendance).

---

## 14. Open Items Checklist (resolve during PRD)

- [ ] Missed-deadline behavior (soft vs hard) — §6
- [ ] Foundations→Labs gating (hard vs advisory) — §6
- [ ] "Weekly missions" = module assignments or separate layer — §6
- [ ] Review coverage: every deliverable vs capstone-only — §8
- [ ] Top-level nav confirmation — §9
- [ ] Application/screening detail: form fields, portfolio required?, who screens, rolling vs fixed windows
- [ ] Certificate: auto-on-completion vs manual, decorative vs verifiable-URL
- [ ] Community: build in-platform vs integrate Discord/Telegram
- [ ] Live workshop host: Zoom/Meet/Riverside? schedule-only vs embed
- [ ] Content authoring: markdown/MDX in repo vs CMS-editable by admin
- [ ] Success metrics — §13
- [ ] Confirm team size + timeline; confirm funding/budget ceiling — §11
