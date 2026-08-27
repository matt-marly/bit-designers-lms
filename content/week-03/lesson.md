# Flow Redesign: Project Brief

> BitDesigners · Craft Materials · ≈10 min read · Issued in Lesson 3

## What this is

Your project for Weeks 3–5: take one core flow from a real Bitcoin wallet experience, and redesign it properly. Grounded in the Bitcoin Design Guide, built on the Bitcoin UI Kit, and shaped for the African user. You defend it live at the Gate 2 crit. This brief is the contract: scope, options, rubric, schedule, and crit format.

## 1. The Project in One Paragraph

Pick one of three flows: **onboarding**, **send**, or **backup**. Study how three real wallets handle it. Then design your own version of that flow as a mobile-first, self-custodial experience for a first-time African Bitcoin user, using the Bitcoin UI Kit as your component foundation. Every screen you present must be defensible with a reason: a Design Guide principle, a heuristic, a competitive finding, or an African-user constraint. "It looks nice" is not a rationale in this program.

## 2. Choose Your Flow

Choose exactly one. Post your choice in #flow-redesign by Sunday of Week 3 for facilitator sign-off. This prevents scope surprises at crit.

### Option A: Onboarding / First Use

From app install to holding a funded, backed-up-or-consciously-deferred wallet. The Design Guide's "First use" chapter is your spine. Scope includes: app store impression → welcome → wallet creation → backup prompt (and skip path) → receiving first sats → the moment the user is "in."

Hard questions you must answer: What do you teach now vs later? What happens when the user skips backup? What does first-use look like on a low-end Android with expensive data?

### Option B: Send

From "I want to pay someone" to honest confirmation of what happened. Units & Symbols plus the sending chapters are your spine. Scope includes: initiating a send → entering/scanning a payment request → amount entry (units! conversion!) → fee communication → the confirmation moment → pending/success/failure states.

Hard questions: How do you make an irreversible action feel appropriately weighty without feeling scary? How does the user know what they'll pay in fees before committing? What does failure look like, and can they recover?

### Option C: Backup

From "you should back up" to a backup the user actually completed and could actually use. Private Key Management and Backup & Recovery chapters are your spine. Scope includes: the backup prompt (timing!) → method choice (manual phrase vs cloud, if you offer both) → the backup ceremony → verification → the recovery flow itself (at minimum as a wireframe).

Hard questions: How do you convey life-savings-level stakes without paralyzing the user? Where does the phrase get written down in a one-room home? Is cloud backup an honest option for your user, and how do you explain its tradeoffs?

**Choosing advice:** Onboarding is the widest scope (breadth risk). Send has the deepest interaction detail (precision risk). Backup is the hardest conceptually (stakes risk). All three can earn top marks; pick the one whose hard questions excite you.

## 3. Constraints (Non-Negotiable)

1. **Self-custodial.** You are designing for a wallet where the user holds their own keys. Custodial patterns (support resets passwords, ops reverses payments) are off the table. That's the whole point.
2. **Bitcoin UI Kit foundation.** Build on the kit's components (bitcoinuikit.com). Extend when you have a reason; document every extension. Inventing components the kit already provides costs you rubric points.
3. **African user context.** Your design must show evidence of designing for: low-end Android screen sizes, data cost consciousness, intermittent connectivity, and a user whose money mental model is mobile money, not banking apps. (Lesson 5 deepens this; start now.)
4. **Mobile-first.** Phone screens only. No desktop, no tablet.
5. **Honest states.** Every flow must include at least its key loading, error/failure, and empty states. Happy-path-only submissions cap at "Revise & resubmit."
6. **No price content.** Fiat conversion for usability is encouraged where it helps users; charts, gains, and market framing are banned.

## 4. Schedule & Deliverables

| Week | Deliverable | Due |
| --- | --- | --- |
| Week 3 | Flow chosen + posted in #flow-redesign · 3-wallet competitive scan in Figma (screens captured, annotated: what works, what fails, and why, tied to a principle or heuristic) | Sunday 23:59 WAT |
| Week 4 | Wireframe v1 of your full flow: low/mid fidelity, structure over polish, all key states present · bring it to the midweek crit call | Sunday 23:59 WAT |
| Week 5 | GATE 2: High-fidelity flow in Figma on the Bitcoin UI Kit, defended at the live crit | Crit slot (book via crit signup) |

The midweek crit call (Weeks 4–5) is the main feedback channel during project weeks. Attend live or watch the recording; feedback given there is assumed known at Gate 2.

## 5. The Crit

15 minutes per designer: 8 present, 7 critique.

Your 8 minutes must cover, in order:

1. The user and context you designed for (1 min)
2. What your competitive scan taught you (1 min)
3. The flow, walked screen by screen, leading with decisions and reasons, not features (5 min)
4. One thing you're unsure about, stated plainly (1 min). Inviting critique on your weak point is a skill this industry runs on.

Critique comes from a facilitator plus one assigned peer critic (you will also serve as a peer critic for someone else; critiquing is assessed culture, not a favor). Critique follows Design Guide language: cite the principle, name the screen, propose the alternative.

## 6. Evaluation Rubric

Each dimension scored 1–4 (1 = missing · 2 = attempted · 3 = solid · 4 = exemplary). Gate 2 approval requires no dimension below 2 and a total of 10+/16.

| Dimension | What "4" looks like |
| --- | --- |
| Guide alignment | Design decisions traceably follow Bitcoin Design Guide patterns; deviations are deliberate and argued, not accidental |
| African-user considerations | Constraints (device, data, connectivity, mobile-money mental models) visibly shaped the design. Not a persona slide, but decisions in the screens |
| Craft | UI Kit used fluently; hierarchy, spacing, and type disciplined; all key states designed; flows hold together end to end |
| Rationale | Every major decision has a reason the designer can state under questioning; competitive findings and heuristics are cited where relevant |

## Quick Links

- Bitcoin Design Guide: <https://bitcoin.design/guide/>
- Bitcoin UI Kit: <https://www.bitcoinuikit.com>
- Cohort Figma team (see Quick Access on the lesson page)
- #flow-redesign · crit signup · midweek crit call link
