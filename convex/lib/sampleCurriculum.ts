export type SampleLesson = { title: string; summary?: string; body: string };
export type SampleModule = {
  title: string;
  description: string;
  objectives: string[];
  published: boolean;
  lessons: SampleLesson[];
};
export type SampleUnit = { title: string; description: string; modules: SampleModule[] };

export const DESIGN_LAB_CURRICULUM: SampleUnit[] = [
  {
    title: "Bitcoin Foundations",
    description: "What Bitcoin is, why it exists, and the vocabulary you'll design with.",
    modules: [
      {
        title: "What is Bitcoin?",
        description: "A plain-language tour of the network, the money, and the people who run it.",
        objectives: [
          "Explain Bitcoin in two sentences to someone who has never used it",
          "Tell the difference between the Bitcoin network and the bitcoin currency",
          "Name the roles of nodes, miners and wallets",
        ],
        published: true,
        lessons: [
          {
            title: "Money without a middleman",
            summary: "Bitcoin lets two people send value to each other without a bank in between.",
            body: `## Money without a middleman

Most digital money is a promise kept by someone else. When you pay with a card, a bank updates a database it controls. Bitcoin replaces that single database with a public ledger that thousands of independent computers keep in sync.

### Two things called "Bitcoin"

- **Bitcoin** (capital B) is the network: the software, the rules and the computers running them.
- **bitcoin** (lowercase, or **BTC**) is the unit of money that moves on that network.

> A useful shorthand: Bitcoin is the road, bitcoin is the car.

### Why designers should care

Every screen you design for Bitcoin sits on top of these properties:

1. **Payments are final.** There is no chargeback button.
2. **Users hold their own keys.** Lose the keys, lose the money.
3. **Fees and confirmation times change.** They depend on how busy the network is.

Keep these three in mind. Most Bitcoin UX problems trace back to one of them.`,
          },
          {
            title: "Nodes, miners and wallets",
            summary: "Nodes check the rules, miners add blocks, wallets manage keys.",
            body: `## Nodes, miners and wallets

Three kinds of software do most of the work on the network.

| Role | What it does | Who runs it |
| --- | --- | --- |
| Node | Downloads every block and checks it against the rules | Anyone who wants to verify for themselves |
| Miner | Bundles transactions into blocks and competes to add them | Specialised businesses with dedicated hardware |
| Wallet | Creates keys, builds transactions, shows balances | Everyday users |

### Nodes keep everyone honest

A node rejects any block that breaks the rules, no matter who mined it. That is why no single company can change Bitcoin on its own.

### Wallets are where design happens

Most people never see a node or a miner. They see a wallet. When a wallet hides complexity well, Bitcoin feels simple. When it doesn't, people make expensive mistakes.`,
          },
          {
            title: "Blocks and confirmations",
            summary: "A transaction becomes harder to reverse with every block added after it.",
            body: `## Blocks and confirmations

Roughly every ten minutes, a miner adds a new **block** of transactions to the chain. Each block points to the one before it, so changing an old block would mean redoing every block after it.

### What a confirmation means

- **0 confirmations:** the transaction has been broadcast but isn't in a block yet.
- **1 confirmation:** it's in the latest block.
- **6 confirmations:** widely treated as settled for large amounts.

### Designing for the wait

Ten minutes is an average, not a promise. A good interface:

- Shows the transaction straight away as *pending*, not missing.
- Explains what "confirming" means in one short line.
- Never shows a spinner with no context.`,
          },
        ],
      },
      {
        title: "Bitcoin and Money",
        description: "Units, supply and why amounts are tricky to display.",
        objectives: [
          "Convert between BTC and sats",
          "Explain Bitcoin's fixed supply",
          "Choose a sensible unit for a given screen",
        ],
        published: true,
        lessons: [
          {
            title: "Bitcoin and sats",
            summary: "One bitcoin is 100,000,000 sats. Small amounts read better in sats.",
            body: `## Bitcoin and sats

A **satoshi** (or **sat**) is the smallest unit of bitcoin.

\`\`\`
1 BTC = 100,000,000 sats
\`\`\`

### Which unit to show

| Amount | In BTC | In sats |
| --- | --- | --- |
| A coffee | 0.00004500 BTC | 4,500 sats |
| A month's rent | 0.0150 BTC | 1,500,000 sats |

Long strings of zeros are hard to read and easy to get wrong. The [Bitcoin Design Guide](https://bitcoin.design/guide/designing-products/units-and-symbols/) recommends letting people switch units and defaulting to whatever is clearest for the amounts your product handles.`,
          },
          {
            title: "A fixed supply",
            summary: "There will only ever be 21 million bitcoin.",
            body: `## A fixed supply

Bitcoin's rules cap the total supply at **21 million**. New bitcoin enter circulation as a reward to miners, and that reward halves roughly every four years.

### What this means for users

- People often think of bitcoin as savings rather than spending money.
- Price swings in local currency can be large. Show both units when the local value matters.

### Design prompt

Sketch a balance screen for someone who thinks in naira but saves in sats. What's the primary number? What's secondary?`,
          },
        ],
      },
      {
        title: "Bitcoin UX Principles",
        description: "The handful of principles that make Bitcoin products feel trustworthy.",
        objectives: [
          "Apply progressive disclosure to Bitcoin concepts",
          "Write clear copy for irreversible actions",
          "Recognise common trust-breaking patterns",
        ],
        published: true,
        lessons: [
          {
            title: "Progressive disclosure",
            body: `## Progressive disclosure

Show people what they need for the task in front of them, and nothing more. Advanced details should be one tap away, not in the way.

### In practice

- A send screen needs an address, an amount and a fee. Coin control can live behind "Advanced".
- A transaction list needs amount, direction and status. The transaction ID can live on the detail screen.

> If everyone needs it, show it. If experts need it, tuck it away. If nobody needs it, cut it.`,
          },
          {
            title: "Designing for irreversible actions",
            summary: "Make the last step slow and clear when the action can't be undone.",
            body: `## Designing for irreversible actions

Bitcoin payments can't be reversed. Your review screen is the last chance to catch a mistake.

### A good review screen

1. Repeats the amount in the unit the user typed it in.
2. Shows the recipient address in readable chunks.
3. Shows the fee and the total.
4. Uses a clear verb on the button: **Send 4,500 sats**, not **Confirm**.

### Avoid

- Pre-filled amounts the user didn't choose.
- Buttons that change position between steps.
- Swipe-to-send without a visible summary.`,
          },
          {
            title: "Building trust",
            body: `## Building trust

People are handing your product real money. Small details signal whether it deserves that.

- **Be specific.** "Waiting for the next block (about 10 minutes)" beats "Processing…".
- **Be honest about risk.** Say plainly when a backup is missing.
- **Be consistent.** The same thing should look and read the same everywhere.

### Exercise

Pick a wallet you use. Find one screen where it builds trust and one where it loses it. Write a sentence about each.`,
          },
        ],
      },
      {
        title: "Bitcoin Wallets",
        description: "Keys, seed phrases and the trade-offs between wallet types.",
        objectives: [
          "Explain what a private key and a seed phrase are",
          "Compare custodial and self-custodial wallets",
        ],
        published: true,
        lessons: [
          {
            title: "Keys and seed phrases",
            summary: "A seed phrase is a human-readable backup of a wallet's keys.",
            body: `## Keys and seed phrases

A wallet doesn't store bitcoin. It stores **keys** that prove you can spend bitcoin recorded on the chain.

Most wallets back up those keys as a **seed phrase**: 12 or 24 ordinary words. Anyone with the words can spend the money.

### Designing backups

- Explain *why* before asking someone to write the words down.
- Never ask for a screenshot.
- Check the backup with a short quiz, but let people skip it and come back later.`,
          },
          {
            title: "Custodial vs self-custodial",
            body: `## Custodial vs self-custodial

| | Custodial | Self-custodial |
| --- | --- | --- |
| Who holds the keys | A company | The user |
| Recovering access | Reset with the company | Seed phrase only |
| Main risk | The company fails or freezes funds | The user loses their backup |

Neither is always right. Many people start custodial and move to self-custody as they learn. Good products make that path clear.`,
          },
        ],
      },
    ],
  },
  {
    title: "Bitcoin Product Design",
    description: "Turning principles into flows people can actually use.",
    modules: [
      {
        title: "Designing for Bitcoin",
        description: "Research, personas and the design process applied to Bitcoin products.",
        objectives: ["Run a short user interview about money habits", "Map a send-and-receive flow end to end"],
        published: true,
        lessons: [
          {
            title: "Know who you're designing for",
            body: `## Know who you're designing for

A merchant in Lagos, a saver in Nairobi and a developer in Accra all use Bitcoin differently. Before you open Figma, talk to people.

### Five questions to start with

1. How do you send money to family today?
2. What was the last payment that went wrong? What happened?
3. Where do you keep savings, and why there?
4. Who do you ask when you're unsure about money?
5. What would make you trust a new app with your money?`,
          },
          {
            title: "Mapping the core flows",
            body: `## Mapping the core flows

Almost every Bitcoin wallet has three core flows: **receive**, **send** and **back up**. Map each one before designing screens.

For each step, note:

- What the user is trying to do
- What they need to know
- What could go wrong

Share your maps in the cohort channel. Comparing them is one of the fastest ways to spot gaps.`,
          },
        ],
      },
      {
        title: "Bitcoin Onboarding Flows",
        description: "Getting a new user to their first transaction without overwhelming them.",
        objectives: ["Design an onboarding flow that defers the seed phrase", "Write first-run copy"],
        published: true,
        lessons: [
          {
            title: "First run",
            body: `## First run

The first minute decides whether someone comes back. Aim to get people to a useful screen fast, and teach in context instead of up front.

### A common pattern

1. Create the wallet in the background.
2. Show an empty home screen with one clear action: **Receive**.
3. Prompt for a backup once there's money worth protecting.`,
          },
          {
            title: "Teaching in context",
            body: `## Teaching in context

Explain a concept at the moment it matters. A fee explainer belongs on the fee picker, not in a welcome carousel.

- Keep explanations to one or two sentences.
- Link to more detail for people who want it.
- Don't block the task while teaching.`,
          },
        ],
      },
      {
        title: "Bitcoin Error States",
        description: "Writing and designing errors people can recover from.",
        objectives: ["Write error messages that say what happened and what to do next"],
        published: false,
        lessons: [
          {
            title: "Anatomy of a good error",
            body: `## Anatomy of a good error

A good error message answers three questions:

1. **What happened?**
2. **Is my money safe?**
3. **What should I do now?**

*Draft: examples coming soon.*`,
          },
        ],
      },
    ],
  },
];

export type SampleMission = {
  /** Title of the module the mission belongs to. */
  moduleTitle: string;
  title: string;
  reviewType: "completion_only" | "reviewed";
  /** Due at the end of this week of the cohort, counting the first week as 1. */
  dueWeek: number;
  brief: string;
  rubric: string[];
};

export const DESIGN_LAB_MISSIONS: SampleMission[] = [
  {
    moduleTitle: "What is Bitcoin?",
    title: "Explain Bitcoin to a friend",
    reviewType: "completion_only",
    dueWeek: 1,
    brief: `Pick someone who has never used Bitcoin and explain it to them in under five minutes. Then write up what happened.

## What to submit

A link to a short doc (Google Docs, Notion, or similar) that covers:

- The two-sentence explanation you opened with
- The questions they asked, word for word if you can
- One thing you'd explain differently next time

This one counts as done as soon as you submit it. Your mentors will still read it.`,
    rubric: [],
  },
  {
    moduleTitle: "Bitcoin UX Principles",
    title: "Wallet UX audit",
    reviewType: "reviewed",
    dueWeek: 3,
    brief: `Audit the send flow of a Bitcoin wallet of your choice, using the principles from this module.

## Steps

1. Install the wallet and send a small amount (or use testnet/signet).
2. Screenshot every screen from "Send" to the confirmation.
3. For each screen, note where the wallet uses progressive disclosure, how it handles the irreversible moment, and what builds (or breaks) trust.
4. Pick the three biggest problems and sketch a fix for each.

## What to submit

A link to a Figma file, FigJam board, or slide deck. You can attach a PDF export too.`,
    rubric: [
      "Covers the full send flow, with a screenshot for every step",
      "Ties each finding to a principle from the module",
      "Identifies the irreversible moment and judges how well it's handled",
      "Proposes three concrete, sketched improvements",
    ],
  },
  {
    moduleTitle: "Bitcoin Wallets",
    title: "Backup flow redesign",
    reviewType: "reviewed",
    dueWeek: 4,
    brief: `Redesign the seed phrase backup flow for a self-custodial mobile wallet.

Your flow should get a first-time user from "wallet created" to "backup verified" without scaring them off, and without letting them skip the parts that matter.

## What to submit

A link to a Figma prototype with the full flow, plus a short note on the trade-offs you made.`,
    rubric: [
      "Explains why the backup matters in plain language",
      "Makes it hard to skip without making it impossible",
      "Verifies the backup without asking for all words in order",
      "Covers what happens if the user leaves halfway through",
    ],
  },
  {
    moduleTitle: "Designing for Bitcoin",
    title: "Persona and core flow map",
    reviewType: "reviewed",
    dueWeek: 6,
    brief: `Choose a Bitcoin product idea and define who it's for.

## What to submit

A link to a doc or board with:

- One primary persona, grounded in at least two real conversations
- A map of the three core flows that persona needs, from first open to their main goal`,
    rubric: [
      "Persona is based on real conversations, not assumptions",
      "Core flows are complete from entry point to goal",
      "Flows call out where Bitcoin-specific concepts first appear",
    ],
  },
];
