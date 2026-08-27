# Self-Custody UX & Lightning UX

> Bitcoin Fundamentals Reader, Part 3 · BitDesigners · Core Materials · ≈20 min read · Pairs with Lesson 4

**How to use this Reader.** The two hardest UX domains in Bitcoin — keys and payments — condensed into pattern summaries you can apply to your Flow Redesign this week. Each section ends with annotated real-wallet examples: what shipping products get right and wrong. Read with your project open.

## Part A: Self-Custody UX

### A.1 The problem in one sentence

Self-custody means the user's money is controlled by a secret (a private key) that only they hold. That is the entire point of Bitcoin, and it also means one mistake with that secret is unrecoverable, forever, by anyone. No other consumer software domain asks interfaces to carry these stakes. Banking apps protect access to money a bank holds; a wallet's backup flow protects the money itself.

### A.2 Seed phrases: the ceremony

Most wallets reduce the key to a recovery phrase: 12 or 24 ordinary words that can restore the wallet on any device. Design patterns that matter:

- **Timing of the prompt.** Demanding backup before the user has any funds feels abstract and gets skipped or done sloppily. The modern pattern (Design Guide "First use"): let the user in fast, then escalate backup urgency as value arrives. Design the skip path as carefully as the happy path. A skipped backup with honest, persistent, non-nagging reminders beats a rushed backup of words scribbled on a receipt.
- **The write-down ceremony.** Slow is correct here. One word at a time or a clean grid; explicit "no screenshots" guidance with the reason (screenshots sync to clouds and get scrolled past strangers); physical-world advice that fits real homes. Where does a phrase live safely in a shared room?
- **Verification.** Confirming a few words back is standard; keep it short enough that users don't rage-quit, real enough that a fake write-down fails.
- **Language.** "Recovery phrase," not "seed," not "mnemonic," not "entropy." Jargon in a life-savings flow is a design failure. And never imply the app can restore the phrase. The honest sentence is hard but necessary: *"If you lose this and lose this phone, no one can recover your money. Not even us. Especially not us."*

### A.3 Responsibility without blame

The tone problem unique to self-custody: the user carries real responsibility, and scared users make worse security decisions than confident ones. Principles:

- **Educate at the moment of relevance**, not in a wall of onboarding warnings (Design Guide first-use pattern: introduce concepts when they become real).
- **Warn about consequences, not competence.** "Anyone with these words can take your money" (fact) vs "Never do X, you could lose everything!!" (fear).
- **Progressive security.** Small balance, light guardrails; growing balance, escalating prompts toward stronger setups. Match the ceremony to the stakes.

### A.4 Modern recovery: beyond 12-words orthodoxy

Manual phrases are not the only honest option, and for many first-time users they're not the best one. The tradeoff table designers must know:

| Scheme | User burden | Protects against | Weak against | Honest fit |
| --- | --- | --- | --- | --- |
| Manual phrase | High (ceremony + safe storage) | Company failure, device loss | Fire/flood/theft of the paper, bad handwriting, forgetting the hiding place | Users with growing balances who accept the ritual |
| Encrypted cloud backup | Very low (near-invisible) | Device loss, user error | Cloud account compromise; requires cloud account + storage space | First-time users, daily-spending amounts; the Design Guide's own default for its reference wallet |
| Multi-key / collaborative | Medium to high | Single-point failure of any one key | Complexity, cost, setup friction | Larger savings; covered at concept level only in this program |

> **Design takeaway:** recovery scheme choice is a UX decision, and the African context weighs in hard. Cloud backups assume Google account hygiene and storage space on cheap phones; paper phrases assume private storage space at home. Neither assumption is free. Present tradeoffs honestly; default to what your specific user can actually sustain.

### A.5 Annotated examples: self-custody

**Phoenix** (non-custodial Lightning, mobile)

- ✅ **Gets right:** Wallet is usable immediately; backup education arrives progressively rather than as a front-loaded wall. Recovery phrase flow is clean, jargon-light, and honest about consequences. Settings surface backup status clearly.
- ⚠️ **Watch for:** Concepts like channel-related fees surface in ways that still assume Bitcoin literacy; a first-time African user hits vocabulary walls in edge cases. Teardown question: at which exact screen would your aunt stop?

**Blink** (custodial-by-default Lightning, born from Bitcoin Beach)

- ✅ **Gets right:** Onboarding with a phone number matches the mobile-money mental model precisely; usernames make sending feel like sending to a person, not a hash; a stable-value account option speaks directly to devaluation anxiety.
- ⚠️ **Watch for:** It's custodial by default, so the seed-phrase ceremony vanishes because Blink holds the keys. That's a legitimate tradeoff for small amounts, but the UX lesson cuts both ways: notice how much friction custody removes, then ask what the interface does (or doesn't do) to make that tradeoff visible to the user. Silence about custody is a dark pattern in this space.

**A hardware signing device flow** (e.g., any current mainstream device)

- ✅ **Gets right:** The physical ceremony (device in hand, buttons pressed, address verified on a separate screen) creates appropriate psychological gravity for large amounts. Stakes are felt, not just stated.
- ⚠️ **Watch for:** Jargon density (PSBT, derivation paths, xpubs) leaks into user-facing screens; setup flows still assume a desktop computer and stable power. Largely inaccessible price-wise for our market: know the pattern, design mostly without it.

## Part B: Lightning UX

### B.1 Why Lightning exists (concept level, all a designer needs)

On-chain Bitcoin transactions are final and global but take minutes to hours and carry variable fees. Unusable for buying airtime. Lightning is a payment network built on top of Bitcoin: money moves through pre-funded channels between participants, making payments instant and nearly free, settling to the Bitcoin base layer only when channels open or close.

Design-level mental model: **on-chain is the vault door; Lightning is the wallet in your pocket.** For African daily-payment use cases, Lightning is not an optimization. It's the product.

### B.2 Channels and liquidity: what leaks into your UI

You don't design channel management (good wallets automate it), but its physics surface in exactly three user-visible places you must handle:

1. **The first receive can cost something.** Opening channel capacity may carry a fee, so a user's very first Lightning deposit can arrive minus a cut. If the UI doesn't warn *before* the deposit, the user experiences it as theft. Disclose upfront, in local-currency terms.
2. **Receive limits exist.** "Inbound liquidity" caps how much a user can receive at a moment. Never show a raw error; show what *is* possible and the path forward.
3. **On-chain vs Lightning must be legible.** Many wallets hold both balances. Users need to know which money is instant-and-cheap and which is slow-and-final, without reading a whitepaper. Naming, iconography, and unified-balance decisions live here.

### B.3 The payment flow patterns

- **Payment requests.** Lightning payments usually begin with an invoice the receiver generates (QR or shared string): a *pull* model, unlike mobile money's push-to-phone-number. This inverts your user's expectations; design the request-creation flow as a first-class citizen, not a buried feature. Newer address formats (human-readable name@wallet Lightning addresses) restore the "send to a person" feel. Use them.
- **QR interactions.** The QR is Lightning's handshake. Patterns: large scannable codes (screen brightness boost is a real feature); camera permission asked in context; graceful paste-instead-of-scan path; QR display that survives cracked screens and harsh daylight. That last one is an African-market constraint that is very literal.
- **Amount entry.** Everything from the Units & Symbols chapter, compressed into the fastest-moving screen in your app. Sats default for Lightning; live local-fiat conversion adjacent, honestly labeled as approximate.
- **Speed as feel.** Lightning success is near-instant, so let it feel that way. Optimistic UI with honest settling states; a success moment worth a micro-celebration. Payments that feel instant build the trust that Lesson 3 said the interface must earn alone.

### B.4 Fees, and failure states worth respecting

- **Fee UX.** Lightning fees are usually tiny. Say so with numbers, before commitment, in terms the user prices groceries in ("Fee: ₦4"). Never bury a fee in the settled total; discovered fees destroy trust at mobile-money speed, because that's the betrayal users already know.
- **Failure is normal; dishonest failure is fatal.** Lightning payments can fail for routing or liquidity reasons that are not the user's fault and usually resolve on retry. The pattern trio: **honest** (say it failed, never fake success), **blameless** ("the payment couldn't find a route": the network's fault, in human words), **recoverable** (retry button, funds-are-safe reassurance, alternative path). A failed payment with clear state and easy retry does less trust damage than a spinner that lies.
- **Pending is a state, not an apology.** Design waiting: what's happening, how long is normal, what the user can safely do meanwhile (including: close the app).

### B.5 Annotated examples: Lightning

**Phoenix**

- ✅ Fee transparency before send; automated channel management with disclosed costs; failure states that name the reason and offer retry.
- ⚠️ The first-receive channel fee, though disclosed, still reliably surprises users. Evidence that disclosure *placement* matters as much as presence. Where would you move it?

**Blink**

- ✅ Payment flow feels like mobile money: usernames, contacts, instant settle, clean success moment. The strongest "meets users where they are" example on the market.
- ⚠️ The custody tradeoff again: instant everything partly because it's their ledger. When your Flow Redesign is self-custodial, you must earn this smoothness honestly. That's the assignment inside the assignment.

**Machankura** (USSD, feature phones, met in Lesson 2)

- ✅ Lightning with no smartphone, no app, no data: `*number#` and menus — the exact interaction grammar of African mobile money.
- ⚠️ Menu-tree depth and session timeouts are its UX ceiling. Included here as the boundary case: Lightning UX at maximum constraint. Study it whenever your design assumes too much phone.

## This Week's Working Segment

Bring your wireframe-in-progress to the live call. You'll apply one pattern from today (a backup prompt, a fee disclosure, a failure state) to your own flow during the session, then trade quick critique in breakouts. Patterns learned same-day and applied same-day stick.

## Glossary (Lesson 4 additions)

- **Private key / Recovery phrase** — The secret controlling funds; the 12/24-word human-writable form of it.
- **Custodial / Non-custodial** — (From Part 1, now load-bearing:) who holds the keys, a company or the user.
- **Channel** — A pre-funded Lightning connection through which instant payments flow.
- **Liquidity (inbound/outbound)** — Capacity to receive/send on Lightning at a given moment.
- **Invoice / Payment request** — The receiver-generated request (usually a QR) that initiates a Lightning payment.
- **Lightning address** — Human-readable name@domain identifier for receiving Lightning payments.
- **Routing** — How a payment finds a path through the Lightning network; the usual culprit when payments fail blamelessly.
- **On-chain** — A transaction on the Bitcoin base layer: slower, final, global.

---

*Next: Lesson 5 — Patterns, the UI Kit & the African User, where these patterns meet shared components and the module no other Bitcoin design program teaches.*
