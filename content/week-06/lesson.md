# Part A: Audit Rubric & Templates

> BitDesigners · Research & Contribute Materials · ≈15 min read · Pairs with Lesson 6 · Governs Gate 3

**What this is.** The shared instrument for your Gate 3 UX audit: the scoring rubric every audit uses, the report template every audit follows, and the checklist every audit passes before publishing. One shared rubric means every BitDesigners audit is comparable to every other — and comparable audits are what make our public feed a credible body of work instead of a pile of opinions.

## 1. What Counts as an Audit Here

A BitDesigners audit is **heuristic evaluation plus primary research**, applied to one real, open-source Bitcoin product:

1. **Heuristic evaluation:** you walk the product's core flows against the 12 criteria below, scoring each with evidence (annotated screenshots).
2. **Primary research:** at least two user interviews or one moderated usability test (3–5 participants), run with the Research Ethics & Consent Kit (Part B).
3. **Synthesis:** findings that connect what you scored with what you observed, ranked by severity.

**Product eligibility:** real, shipping, open source, and Bitcoin-related (wallets, Lightning apps, tools, educational products). Choose something you can actually use end to end with small amounts of sats. Confirm your pick at the Week 6 Sunday checkpoint.

## 2. The Scoring Rubric

Twelve criteria in three groups. Score each 0 to 3:

- **0 = Fails.** The product actively violates this criterion in a core flow.
- **1 = Weak.** Violations are common or the criterion is met only in the happy path.
- **2 = Adequate.** Generally met; lapses are minor or in edge cases.
- **3 = Strong.** A pattern other products should copy. Reserve 3s; they should mean something.

Every score requires at least one annotated screenshot as evidence. A score without evidence is an opinion, and opinions don't publish.

### Group A: Universal usability (from NN/g's heuristics)

- **A1 Visibility of system status** — Does the user always know what's happening: pending, syncing, confirming, failed?
- **A2 Match with the real world** — Human words over protocol jargon; concepts in the user's language and currency
- **A3 User control & error prevention** — Confirmation moments where stakes are high; undo where possible; no dead ends
- **A4 Consistency & recognition** — Internal consistency, platform conventions, recognition over recall
- **A5 Help & recoverability** — Errors in plain language with a way forward; help available where needed

### Group B: Bitcoin-specific (from the Bitcoin Design Guide)

- **B1 Units & amounts** — Sats/BTC clarity, honest fiat conversion, precision and rounding, amount entry
- **B2 Irreversibility handling** — Weight of confirmation moments matches stakes; address/request verification support
- **B3 Fee transparency** — Fees disclosed before commitment, in understandable terms; no discovered fees
- **B4 Custody honesty** — Is who-holds-the-keys legible? Backup/recovery flows match the custody model's real stakes
- **B5 Failure states** — Honest, blameless, recoverable; pending designed as a state, not an apology

### Group C: Context fit (our addition)

- **C1 Device & data reality** — Behavior on small screens and low-end Android; data weight; offline/intermittent tolerance
- **C2 First-time accessibility** — Can a mobile-money-native, first-time Bitcoin user get through the core flow? Language, literacy load, assumed knowledge

Maximum: 36. The number is not the point; **the profile is.** A wallet scoring 30 with a 0 in B4 has a headline finding.

### Severity ranking for findings

Rank every finding you report:

- **S1 Critical:** can cause loss of funds or complete abandonment (e.g., backup flow that fails silently)
- **S2 Major:** blocks or badly degrades a core task for many users
- **S3 Minor:** friction, confusion, or inconsistency worth fixing
- **S4 Polish:** cosmetic or nice-to-have

## 3. The Audit Report Template

Your published audit follows this structure, in this order. Length target: the report should be readable in 15 minutes; depth lives in the annotated Figma file you link, not in wall-of-text prose.

1. **Summary** (150 words max): the product, the verdict in one sentence, the top 3 findings.
2. **Product & scope:** what the product is, which flows you audited (minimum: onboarding + one core task), version and device tested, dates.
3. **Method:** rubric version, participants (count and anonymized profile only), what research you ran. One paragraph.
4. **Scorecard:** the 12 scores in a table, each linked to its evidence.
5. **Findings:** each finding gets: severity, title, what happens (with screenshot), why it matters (cite the criterion, heuristic, or Guide chapter), and a recommendation. Order by severity. 5 to 10 findings is the sweet spot.
6. **What this product gets right:** minimum two genuine strengths with evidence. Audits that only attack read as takedowns and close doors; our audits open them.
7. **Research notes:** what your interviews or test added that the heuristic pass missed. This section is where your audit becomes better than an armchair review.
8. **Limitations:** honest boundaries (your device, sample size, flows not covered).
9. **Appendix link:** the annotated Figma file.

## 4. Publishing Checklist

Before an audit goes to the BitDesigners feed, every box must be checked. Your reviewer checks them too; unchecked boxes are the most common cause of "Revise & resubmit" at Gate 3.

### Evidence & fairness

- Every score has annotated screenshot evidence
- Every finding cites a criterion, heuristic, or Design Guide chapter
- At least two strengths documented with evidence
- Tested the latest release version (note the version number)
- Tone check: would you say every sentence to the maintainer's face on a community call? (You may be doing exactly that in Week 8.)

### Ethics & privacy

- All participants consented per the Consent Kit; recordings handled per the kit's rules
- No participant is identifiable (name, voice, face, username, location detail)
- No screenshot exposes real balances, addresses, transaction IDs, or contact lists (yours or anyone's). Use test amounts; redact anything that slipped through
- No question was asked, anywhere, about anyone's holdings

### Craft

- Report follows the template order and stays within length
- Summary readable by a non-designer
- Figma appendix organized: one page per flow, findings flagged with severity labels
- Spelling, naming, and screenshots consistent throughout

## 5. After Publishing

Your audit is your Lesson 8 raw material: Gate 4 asks you to turn one finding into a scoped, submitted contribution. Write your recommendations knowing you may be the one implementing them. That knowledge has a wonderful way of making recommendations realistic.

---

# Part B: Research Ethics & Consent Kit

> BitDesigners · Research & Contribute Materials · ≈10 min read · Required for all Gate 3 research

**Why this kit exists.** Bitcoin users are a privacy-sensitive population, and for good reason: knowing who holds money, how much, and where has gotten people robbed, extorted, and worse. Researching them is a trust exercise. This kit is the non-negotiable floor for any research done under the BitDesigners name. Read it *before* you recruit anyone.

## 1. The Five Rules

1. **Never ask about holdings.** Not how much, not roughly, not "small or large," not in follow-ups, not off the record. If a participant volunteers an amount, do not write it down and do not use it.
2. **Consent is informed and revocable.** Participants know what you're studying, what's recorded, where findings go (a public audit), and that they can stop or withdraw at any time — including after the session.
3. **Anonymize at the source.** Assign a code (P1, P2...) the moment you recruit. Real names never enter your notes, files, transcripts, or Figma.
4. **Minimize what you collect.** If a piece of data doesn't serve the research question, don't gather it. You cannot leak what you never collected.
5. **Guard the data like it's money.** Because for this population, it can be.

## 2. Consent Script (read aloud before every session)

Adapt bracketed parts; do not cut the substance. For low-literacy or cross-language sessions, deliver it verbally in the participant's language and record their verbal agreement.

> "Thank you for making time. My name is [name], and I'm a design student in the BitDesigners program. I'm studying how people use [product], to find ways its design could be better. I am not from [product]'s company, and nothing you say affects your access to it.
>
> A few important things before we start:
>
> First, this session is voluntary. You can skip any question, take a break, or stop completely at any time, and you don't need to give a reason.
>
> Second, [I would like to record the screen and our voices / I will only take written notes]. The recording is only for my analysis. It will be stored privately, and deleted within 60 days.
>
> Third, what I learn will go into a public report, but nothing in that report can identify you. No name, no photo, no voice, no details that point to you. You will be 'Participant [N].'
>
> Fourth, I will never ask how much money you have, in Bitcoin or anything else. If money amounts come up, I won't record or report them. And please don't show me real balances if you can avoid it; we'll use small test amounts I provide.
>
> Fifth, if you change your mind after today, message me and I will delete your data. No questions asked.
>
> Do you agree to take part? [Wait for a clear yes.] Do you agree to the recording? [Wait for a clear yes, or switch to notes only.]"

Log both answers with the participant code and date in your research log.

## 3. Anonymization Rules

- **Codes, not names, everywhere:** notes, transcripts, filenames, Figma, your head if you can manage it.
- **Strip indirect identifiers.** A "28-year-old female POS agent in [specific market] in Kaduna" is identifiable. Report at the level of "a young merchant in northern Nigeria."
- **Recordings:** stored in one private folder, never in the cohort Figma or any shared drive, never posted even partially, deleted within 60 days of your audit publishing. Screen recordings must not show real balances, addresses, contacts, or notification content; blur or crop before any excerpt enters your appendix.
- **Quotes:** paraphrase or use short verbatim fragments; check each quote couldn't identify the speaker by its content ("as the only female mechanic in my town..." identifies).
- **Participant safety beats research value. Every time.** If publishing something useful might expose someone, it doesn't publish.

## 4. Recruiting Fairly

- Recruit adults (18+) only.
- No pressure recruiting: money-adjacent power dynamics (your boss, someone who owes you) make consent murky.
- Compensation: airtime or small sats amounts are fine and culturally right; state the amount upfront; never make it contingent on "good" answers.
- 2 interviews or 1 usability test with 3–5 participants is the Gate 3 minimum. Recruit one extra; someone always cancels.

## 5. Interview Guide Template (45 to 60 min)

Structure your guide in five blocks. Write your own questions inside each; bring 8–12 total and expect to use 6.

1. **Warm-up (5 min):** rapport, context, their day. No Bitcoin yet.
2. **Money life (10 min):** how they move and manage money generally: cash, mobile money, banks, agents. Listen for workarounds; workarounds are unmet needs wearing work clothes.
3. **Bitcoin story (15 min):** how they started, what they use, walk-me-through-the-last-time-you-[sent / received / backed up]. Ask for the story, not the opinion: "tell me about the last time" beats "do you usually."
4. **The product (15 min):** their experience with [product] or, if they're new to it, first reactions to its core flow (this can blend into a mini usability moment). Probe frustrations neutrally: "what happened next?" not "wasn't that annoying?"
5. **Wrap (5 min):** "what would you tell the people who make this?", thanks, compensation, reminder of withdrawal right.

Technique reminders (from *Just Enough Research*): ask open questions; embrace silence — count to five before rescuing; never explain the interface's intent mid-session; note what they *do* over what they *say* they do.

## 6. Usability Test Plan Template (per session: 30 to 45 min)

Fill every field before your first session; your reviewer may ask for this plan.

- **Research question:** the one thing this test must answer (e.g., "can a first-time user complete a Lightning receive without help?")
- **Product & flow:** exact build/version, exact starting screen.
- **Participants:** count (3–5), profile in anonymized terms, recruiting source.
- **Setup:** device (theirs or yours; yours is safer for privacy), test wallet pre-funded with small sats by you, network conditions, recording method per consent.
- **Tasks (3–5)**, each written as a realistic scenario with a goal, not instructions: "Your cousin needs to pay you 5,000 sats. Make that possible" beats "tap Receive."
- **Success criteria per task:** completed / completed with struggle / failed, plus what counts as struggle.
- **Moderation rules:** think-aloud prompt; help protocol (only after 2 minutes stuck, log it as a fail-with-assist); neutral probes only.
- **Data captured:** task outcomes, time, quotes, observed confusions; mapped afterward to rubric criteria.
- **Debrief:** two questions max, then thanks and compensation.

## 7. If Something Goes Wrong

A participant gets distressed, discloses something sensitive, or a real balance appears on screen: pause, offer to stop, delete the affected recording segment, note the event (not its content) in your log, and tell your facilitator. Handling it well is part of the craft; hiding it is the only actual failure.
