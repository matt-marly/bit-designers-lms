# Part A: Contribution Playbook

> BitDesigners · Research & Contribute Materials · ≈20 min read · Living document, facilitator-maintained · Pairs with Lessons 7–8

**What this is.** The map from "I finished my audit" to "I made a real contribution": where design contributions are welcome in the Bitcoin open-source world, how to pick your target, the proposal formats that work, and what to do when nobody replies. The project list is maintained by facilitators each cohort; live issue links go stale fast, so we list hunting grounds, not pinned issues, and post fresh picks in #contributions.

## 1. The Contribution Ladder

Climb in order. Each rung earns the credibility the next rung spends.

1. **Comment on an issue with evidence** (Lesson 7's assignment). Cost: an hour. Earns: presence.
2. **Improve the Design Guide or project docs:** clarify a confusing passage, add a missing example, fix an outdated screenshot. Browser-editable, genuinely valued, and the most underrated first contribution in the ecosystem.
3. **Propose a flow improvement:** an issue with your evidence, frames, and open questions. This is the standard Gate 4 shape.
4. **Own a feature's design:** ongoing collaboration with a project. Post-graduation territory; the bootcamp's mentorship track carries approved contributions here.

Gate 4 requires rung 2 or 3, formally submitted. Submitted, not merged: you control submission quality; merging involves maintainer capacity and timelines you don't control, so it's not how we grade you.

## 2. Where to Contribute: The Hunting Grounds

Tagged by difficulty: 🟢 gentle first target · 🟡 moderate (needs product fluency) · 🔴 ambitious (active, fast-moving projects).

### Design infrastructure (the community's own projects)

- 🟢 **Bitcoin Design Guide** (BitcoinDesign/Guide): the spine of this whole program, openly maintained, always in need of clearer examples, updated screenshots, and new perspectives. African-context examples are a genuine gap you are specifically qualified to fill. Look for `good first issue` and `content` labels.
- 🟢 **Bitcoin Icons** (BitcoinDesign/Bitcoin-Icons): missing icons, naming, consistency. Small, satisfying, shippable.
- 🟡 **Bitcoin UI Kit** (bitcoinuikit.com, GitHub linked from the site): component gaps and variants; you've used it for three weeks, so your friction log is a contribution list.

### Wallets & Lightning apps

- 🟡 **Blixt Wallet:** has collaborated with the design community before (see its case study in the Guide); receptive to UX input.
- 🟡 **Zeus, BlueWallet, and other open-source wallets:** rich issue trackers with recurring UX debates; search "UX", "onboarding", "confusing".
- 🔴 **Bitcoin Core App:** an active design-community collaboration redesigning the original wallet; high visibility, high standards — watch the design calls before proposing.

### Adjacent freedom tech (all Bitcoin-Design-Community-adjacent)

- 🟡 **Ecash wallets** (Cashu ecosystem: eNuts, Minibits; Fedimint clients): young products, design debt everywhere, small teams that answer.
- 🟡 **Nostr clients** (Amethyst, and others): fast-moving, informal, good for designers who can tolerate chaos.
- 🟢 **Machankura and African-market tools:** where your context knowledge is rarest and most valuable; smaller communities, warmer welcomes.

Rule for all of the above: current facilitator-verified picks with live issue links are posted in #contributions each cohort. Verify a project is active (commits or issue activity within the last month) before investing in it.

## 3. Choosing Your Gate 4 Target

Score each candidate honestly, 1–5 each; pick the highest total, break ties toward smaller:

- **Evidence link:** does one of your audit findings directly support this contribution? (No evidence link, no Gate 4 fit; this is the defining criterion.)
- **Activity:** did a maintainer respond to anyone in the last 30 days?
- **Size:** can the proposal be understood in five minutes and executed in one PR or one issue?
- **Convention fit:** have you seen how this project accepts design input, and can you match it?
- **Care:** will you still be interested after graduation? (Contributions have follow-up.)

Classic mistake, named so you can avoid it: **proposing a redesign of the whole app.** Maintainers can't accept what they can't review. Small, evidenced, respectful of conventions is the entire formula.

## 4. Proposal Templates

### 4a. Evidence-backed design proposal (rung 3, the standard Gate 4 shape)

**Title:** [Problem statement, not solution]

**Problem.** What happens, to whom, with evidence: "In my published UX audit of [product] ([link]), [N] of [M] test participants [observed behavior]. Screenshot: [inline]."

**Why it matters.** One paragraph. Tie to the product's own goals or the Design Guide: "[Guide chapter] recommends [pattern]; the current flow inverts it."

**Proposal.** 1–3 annotated frames inline. Figma view link beneath. One paragraph of rationale: the decisions and their reasons, not a screen-by-screen tour.

**Tradeoffs & open questions.** 2–3 genuine ones: "This adds a step to first-use; is that acceptable for [benefit]?" Invite the critique; it's how proposals become collaborations.

**About me.** One line: "Product designer, BitDesigners cohort [N]; this proposal follows from my audit of [product]."

### 4b. Design Guide / docs improvement (rung 2)

**Title:** [Section] : [what's unclear or missing]

**Current state.** Quote or screenshot the passage.

**The gap.** Who trips on it and why; your cohort experience is legitimate evidence ("three designers in our cohort read this as meaning X").

**Suggested change.** The replacement text or example, written out in full, ready to become a PR. For screenshots: the updated image attached, device and version noted.

## 5. Communication Norms (async, public, across time zones)

- **Write for the archive.** Every thread is read for years by people who weren't there. Context first, always: links, versions, screenshots.
- **Disagree with the design, never the designer**, and always with an alternative attached. "This confused my test participants; would [option] preserve the intent?" is our house register.
- **Receive critique like it's free consulting, because it is.** "Good catch, updated" beats a paragraph of defense. You are allowed to push back; do it once, with evidence, then let the maintainer decide.
- **Time zones are real:** 24–48 hours is a fast reply in OSS. Never bump before a week.
- **The silence protocol:** no reply after 7–10 days → one polite nudge adding new value ("added a variant addressing [likely concern]"). Still nothing after another week → post it to the community's design Discord for feedback, and move your energy elsewhere. Silence is capacity, not verdict; the contribution still counts (and still counts for Gate 4).

## 6. Annotated Example Threads

Facilitators maintain 2–3 exemplary real threads here per cohort, each annotated: what the opener did right, where the turn came, how it resolved. Study the moves, not the specifics.

## 7. After Gate 4

Approved contributions enter the mentorship track: the bootcamp pairs you with a mentor to carry your submission through review toward merge, past graduation. The case study you write (Part B) is the portfolio version of this same story. One finding, one proposal, one public paper trail: that's a Bitcoin design career, started.

---

# Part B: Case Study Template

> BitDesigners · Lesson 8 Materials · ≈10 min read + your writing time · Required for Gate 4

**What this is.** The template that turns your contribution into a portfolio piece, and a worked example showing the standard. The structure is fixed: **problem → evidence → design → response → what's next.** Five sections, 800–1,200 words total, one hero image. Hiring managers spend 3 minutes on a case study; this structure front-loads what they're checking for: can you find real problems, reason from evidence, and ship into the real world.

## 1. Why This Structure

Most junior case studies fail the same way: they narrate process ("then I made wireframes") instead of demonstrating judgment. This template forces judgment into view. Every section answers a question an employer or maintainer actually has:

| Section | The question it answers |
| --- | --- |
| Problem | Can you find a problem worth solving? |
| Evidence | Do you reason from data or from taste? |
| Design | Can you translate findings into decisions? |
| Response | Can you operate in the real world, with real stakeholders? |
| What's next | Do you understand that shipping is a middle, not an end? |

## 2. The Template

Copy this skeleton into your workspace and write inside it.

**[Title: the outcome, not the activity]** — Format: "[What changed or was proposed] for [product]". "A safer backup skip-path for [wallet]" beats "My [wallet] contribution project".

**Hero image:** your strongest single frame — ideally a before/after pair or your key screen, annotated.

**One-line summary:** product, problem, what you submitted, current status. This line goes on your CV too; write it to survive alone.

**The problem (≈150 words).** What happens, to whom, in what context. Ground it in the user, not the interface: "First-time users who skip backup during onboarding never return to it, leaving funds unrecoverable if the phone is lost" — not "the backup screen had issues." End with why this problem matters in your market specifically, if it does; that context is your differentiator.

**The evidence (≈200 words).** Where the problem came from: your Gate 3 audit. The rubric scores that flagged it, what your interviews or usability test showed (counts, not vibes: "3 of 4 participants"), one short participant quote if it earns its place. Link the published audit. This section is what separates you from every designer with opinions.

**The design (≈300 words).** Your proposal, led by decisions and reasons. For each major decision: what you chose, what you rejected, and why (cite the Design Guide chapter, the heuristic, or the finding). 2–4 frames inline, annotated. Include the constraint conversation: what the project's conventions, technical realities, or your user's device context forced. Link the Figma.

**The response (≈200 words).** What happened when it met the world: where you submitted it (link the issue/PR), what maintainers said, what you changed in response, current status. Silence is a valid response to report: "No maintainer response after two weeks; per community norms I posted to the design Discord, where it received [feedback]" shows professional operation, not failure. Never editorialize bitterness; the paper trail speaks.

**What's next (≈100 words).** The honest state: what would carry this to merge, what you'd do with another two weeks, what the mentorship track picks up. One sentence on what the process taught you — exactly one, and make it specific.

## 3. Worked Example (condensed)

A compressed illustration of the standard. Your real case study runs fuller.

> ### A visible fee disclosure for first-time Lightning receives in [Wallet X]
>
> **Summary:** Proposed relocating [Wallet X]'s channel-fee disclosure from the settings FAQ to the receive flow itself, after my audit found first-receive fee surprise to be its highest-severity finding. Submitted as issue #412; maintainer engaged; revision under discussion.
>
> **The problem.** A first-time user's very first Lightning deposit can arrive minus a channel-opening fee. In [Wallet X], the only warning lives in a settings FAQ. Users experience the deduction as theft, and in an African context where the first deposit is often a remittance worth days of wages, that first impression is fatal to trust.
>
> **The evidence.** My published audit scored [Wallet X] 1/3 on Fee Transparency (B3). In usability tests, 4 of 5 participants did not anticipate the fee; 3 interpreted the deduction as an error or scam. One participant closed the app and did not return.
>
> **The design.** A fee preview line on the receive screen, shown before the QR, denominated in the user's local currency ("A one-time setup fee of about ₦120 applies to your first deposit"). I rejected a blocking modal (adds friction to every receive to fix a first-receive problem) and a post-hoc explanation (the trust damage is already done). Follows Design Guide "Lightning liquidity" guidance on upfront disclosure.
>
> **The response.** Submitted as issue #412 with audit evidence and two frames. Maintainer responded in 5 days: receptive, flagged that fee amounts aren't known precisely pre-receive. Revised to a range display ("₦100–150"). Discussion ongoing.
>
> **What's next.** A merged version needs the range calculation exposed by the wallet's LSP integration; the maintainer has opened a linked technical issue. With two more weeks I'd usability-test the range phrasing. What I learned: disclosure placement is a harder design decision than disclosure content.

## 4. Craft Rules

- Word counts are ceilings, not targets. Tight beats complete.
- Every image annotated. An unannotated screenshot asks the reader to do your job.
- Links verified the day you publish: audit, Figma (view access tested logged-out), issue/PR.
- No em dashes, no filler, no "journey." Write like the designer you're presenting yourself as.
- Tone check from the audit rubric applies here too: every sentence about the product and its maintainers, sayable to their faces. Your case study is public and permanent; it should open doors in five years, not embarrass you in two.
- Publish to your portfolio AND the BitDesigners feed. Both links go in your Gate 4 submission.
