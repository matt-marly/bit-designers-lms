import type { TrackPermission } from "./permissions";

/** Demo accounts can't sign in: their token identifiers use this prefix, which Clerk never issues. */
export const DEMO_TOKEN_PREFIX = "demo|";
export const DEMO_EMAIL_DOMAIN = "example.com";

export type MissionKey = "explain" | "audit" | "backup" | "persona" | "triage";

/**
 * - `submitted` / `in_review`: one version waiting on a mentor
 * - `needs_revision`: one version sent back
 * - `revised_waiting`: sent back, then a second version waiting
 * - `passed` / `passed_after_revision`: done, first time or on the second version
 */
export type WorkState = "submitted" | "in_review" | "needs_revision" | "revised_waiting" | "passed" | "passed_after_revision";

export const MISSION_TITLES: Record<MissionKey, string> = {
  explain: "Explain Bitcoin to a friend",
  audit: "Wallet UX audit",
  backup: "Backup flow redesign",
  persona: "Persona and core flow map",
  triage: "Triage a design issue",
};

export type DemoStaff = {
  name: string;
  bio: string;
  portfolio?: string;
  role: "lead_mentor" | "co_mentor";
  permissions?: TrackPermission[];
};

export type DemoLearner = {
  name: string;
  bio: string;
  portfolio?: string;
  showInShowcase?: boolean;
  /** Lessons completed, counted in curriculum order across published modules. */
  lessons: number;
  work: Partial<Record<MissionKey, WorkState>>;
  late?: MissionKey[];
};

export const DESIGN_LAB_STAFF: DemoStaff[] = [
  {
    name: "Kemi Adeyemi",
    role: "lead_mentor",
    bio: "Product designer on self-custody wallets for six years. Leads Design Lab and runs the weekly critiques.",
    portfolio: "https://kemiadeyemi.design",
  },
  {
    name: "Yaw Mensah",
    role: "co_mentor",
    permissions: ["track.reviews", "track.workshops", "track.announcements"],
    bio: "Design lead at a Lightning payments startup in Accra. Obsessed with payment flows that work on slow networks.",
    portfolio: "https://yawmensah.com",
  },
  {
    name: "Zainab Bello",
    role: "co_mentor",
    permissions: ["track.reviews"],
    bio: "UX researcher. Has interviewed 200+ Bitcoin users across West Africa about savings and remittances.",
    portfolio: "https://www.linkedin.com/in/zainab-bello-ux",
  },
];

export const OSS_STAFF: DemoStaff[] = [
  {
    name: "Chinedu Okafor",
    role: "lead_mentor",
    bio: "Contributor to the Bitcoin Design Guide and several open source wallets. Leads Open Source Lab.",
    portfolio: "https://github.com/chineduokafor",
  },
  {
    name: "Amara Nwosu",
    role: "co_mentor",
    permissions: ["track.reviews"],
    bio: "Design systems engineer. Maintains a Bitcoin UI component library in her spare time.",
    portfolio: "https://amaranwosu.dev",
  },
];

/** Cohort 01 is in week 6 of 12, so progress is spread out. */
export const COHORT_01_LEARNERS: DemoLearner[] = [
  {
    name: "Tobi Adewale",
    bio: "Product designer in Lagos, moving from fintech into Bitcoin. Interested in onboarding for first-time savers.",
    portfolio: "https://www.behance.net/tobiadewale",
    lessons: 14,
    work: { explain: "passed", audit: "passed", backup: "passed_after_revision", persona: "submitted" },
  },
  {
    name: "Ama Owusu",
    bio: "UI designer from Accra. Previously designed mobile money flows; now exploring Lightning.",
    portfolio: "https://dribbble.com/amaowusu",
    lessons: 12,
    work: { explain: "passed", audit: "passed", backup: "passed", persona: "in_review" },
  },
  {
    name: "Chiamaka Eze",
    bio: "Visual designer turned UX. Building a case study on Bitcoin wallets for market traders in Onitsha.",
    portfolio: "https://chiamakaeze.framer.website",
    lessons: 11,
    work: { explain: "passed", audit: "passed", backup: "submitted" },
  },
  {
    name: "Kwame Asante",
    bio: "Frontend developer learning design. Wants to contribute to open source wallets.",
    portfolio: "https://github.com/kwameasante",
    lessons: 10,
    work: { explain: "passed", audit: "passed_after_revision", backup: "revised_waiting" },
  },
  {
    name: "Fatima Abdullahi",
    bio: "Product designer in Abuja. Researching how families use Bitcoin for remittances.",
    portfolio: "https://www.behance.net/fatimaabdullahi",
    lessons: 10,
    work: { explain: "passed", audit: "passed", backup: "needs_revision" },
  },
  {
    name: "Wanjiru Kamau",
    bio: "UX designer in Nairobi with a background in agritech. Curious about savings tools for farmers.",
    portfolio: "https://wanjirukamau.com",
    lessons: 9,
    work: { explain: "passed", audit: "passed", backup: "in_review" },
  },
  {
    name: "Emeka Obi",
    bio: "Graphic designer learning product design. Loves illustration and iconography.",
    portfolio: "https://dribbble.com/emekaobi",
    lessons: 8,
    work: { explain: "passed", audit: "needs_revision" },
  },
  {
    name: "Adaeze Nwankwo",
    bio: "Design student at UNILAG. First time working on a real product problem.",
    lessons: 8,
    work: { explain: "passed", audit: "submitted" },
    late: ["audit"],
  },
  {
    name: "Kofi Boateng",
    bio: "Service designer from Kumasi. Thinks a lot about trust and how people learn new money.",
    portfolio: "https://kofiboateng.design",
    lessons: 8,
    work: { explain: "passed", audit: "passed" },
  },
  {
    name: "Halima Yusuf",
    bio: "Product designer in Kano. Prefers to keep her work private until it's polished.",
    showInShowcase: false,
    lessons: 6,
    work: { explain: "passed", audit: "submitted" },
  },
  {
    name: "Thandiwe Dlamini",
    bio: "Interaction designer in Johannesburg. Works full time, so she studies on weekends.",
    portfolio: "https://thandiwedlamini.co.za",
    lessons: 5,
    work: { explain: "passed" },
  },
  {
    name: "Seun Bakare",
    bio: "Self-taught designer. Joined to understand Bitcoin beyond the price charts.",
    lessons: 4,
    work: { explain: "passed" },
    late: ["explain"],
  },
  {
    name: "Esi Appiah",
    bio: "Brand designer exploring product work. Based in Cape Coast.",
    portfolio: "https://www.instagram.com/esiappiah.design",
    lessons: 3,
    work: { explain: "passed" },
  },
  {
    name: "David Ochieng",
    bio: "Joined late after a job change. Catching up this week.",
    lessons: 1,
    work: {},
  },
];

/** The pilot ran earlier in the year; most finished and hold certificates. */
export const PILOT_LEARNERS: DemoLearner[] = [
  {
    name: "Ifeoma Chukwu",
    bio: "Pilot graduate. Now designing for a Lagos-based Bitcoin savings app.",
    portfolio: "https://ifeomachukwu.design",
    lessons: 14,
    work: { explain: "passed", audit: "passed", backup: "passed", persona: "passed" },
  },
  {
    name: "Yaw Darko",
    bio: "Pilot graduate and occasional guest critic for Design Lab.",
    portfolio: "https://www.behance.net/yawdarko",
    lessons: 14,
    work: { explain: "passed", audit: "passed_after_revision", backup: "passed", persona: "passed" },
  },
  {
    name: "Nkechi Okoro",
    bio: "Pilot graduate. Contributed onboarding illustrations to the Bitcoin Design Guide.",
    portfolio: "https://dribbble.com/nkechiokoro",
    lessons: 14,
    work: { explain: "passed", audit: "passed", backup: "passed_after_revision", persona: "passed" },
  },
  {
    name: "Musa Ibrahim",
    bio: "Pilot graduate. Product designer at a remittance company in Abuja.",
    portfolio: "https://musaibrahim.co",
    lessons: 14,
    work: { explain: "passed", audit: "passed", backup: "passed", persona: "passed_after_revision" },
  },
  {
    name: "Abena Mensah",
    bio: "Took a break halfway through the pilot; planning to rejoin a later cohort.",
    lessons: 9,
    work: { explain: "passed", audit: "passed", backup: "needs_revision" },
  },
  {
    name: "Tunde Bakare",
    bio: "Pilot participant. Focused on research and interviews.",
    portfolio: "https://www.linkedin.com/in/tundebakare",
    lessons: 6,
    work: { explain: "passed", audit: "passed" },
  },
];

export const OSS_LEARNERS: DemoLearner[] = [
  {
    name: "Ngozi Uche",
    bio: "Designer and part-time developer. Wants her first merged design PR this year.",
    portfolio: "https://github.com/ngoziuche",
    lessons: 4,
    work: { triage: "passed" },
  },
  {
    name: "Kojo Antwi",
    bio: "UX designer from Takoradi. Comfortable in Figma, new to GitHub.",
    portfolio: "https://kojoantwi.design",
    lessons: 4,
    work: { triage: "in_review" },
  },
  {
    name: "Aisha Mohammed",
    bio: "Product designer in Kaduna. Interested in accessibility in Bitcoin apps.",
    lessons: 3,
    work: { triage: "needs_revision" },
  },
  {
    name: "Brian Otieno",
    bio: "Developer advocate in Nairobi learning design to improve docs and tooling.",
    portfolio: "https://github.com/brianotieno",
    lessons: 3,
    work: { triage: "submitted" },
  },
  {
    name: "Zodwa Khumalo",
    bio: "Design systems designer from Durban.",
    portfolio: "https://zodwakhumalo.com",
    lessons: 2,
    work: {},
  },
  {
    name: "Ifeanyi Okeke",
    bio: "Recent graduate. Learning how open source communities make decisions.",
    lessons: 1,
    work: {},
  },
];

export const SUBMISSION_NOTES: Record<MissionKey, string[]> = {
  explain: [
    "Recorded with my cousin who runs a phone accessories shop. He asked great questions about fees.",
    "I explained it to my mum using the example of esusu savings groups. Notes are in the doc.",
    "Did this over WhatsApp voice notes, transcribed the main questions in the doc.",
  ],
  audit: [
    "Audited the send flow of two wallets on a low-end Android phone. Screenshots are annotated in Figma.",
    "Focused on the first-run experience and receive flow. Ranked issues by severity.",
    "I tested with three friends and included their quotes next to each finding.",
  ],
  backup: [
    "Redesigned the backup reminder so it appears after the first deposit instead of at setup.",
    "Explored three directions for recovery phrase verification; v2 goes with the cloud-free option.",
    "Added a paper backup checklist and a recovery test flow.",
  ],
  persona: [
    "Two personas based on the interviews from week 4, plus a core flow map for sending money home.",
    "Persona is a market trader in Aba; flow covers receiving payments and saving weekly.",
  ],
  triage: [
    "Triaged three open issues on a wallet repo; wrote suggested labels and next steps for each.",
    "Picked an issue about confusing fee labels and wrote a reproduction with screenshots.",
  ],
};

export const REVIEW_COMMENTS: Record<MissionKey, { passed: string[]; revision: string[] }> = {
  explain: { passed: [], revision: [] },
  audit: {
    passed: [
      "Clear, well-prioritised findings. The severity ranking makes it easy to see what to fix first. Great use of real user quotes.",
      "Strong audit. Your note about the fee screen hiding the total is spot on. Consider adding a before/after for your top issue in your portfolio.",
      "Thorough and grounded in real testing. The low-end device angle is exactly what this track is about.",
    ],
    revision: [
      "Good start, but most findings are visual polish. Look again at the send flow: what happens when someone pastes the wrong address type?",
      "The findings need evidence. Add a screenshot and a one-line user impact for each, and rank them by severity.",
    ],
  },
  backup: {
    passed: [
      "Timing the backup prompt after the first deposit is a smart call. The verification step is much friendlier than the usual 'tap words in order'.",
      "Lovely work. The recovery test flow is something most wallets skip. Your rationale section is clear and convincing.",
      "Solid redesign that respects how people actually behave. Ready for your portfolio.",
    ],
    revision: [
      "The flow looks great, but it still asks for the recovery phrase before the user understands why. Try moving the explanation earlier and test it with someone new to Bitcoin.",
      "You've covered the happy path well. Please add what happens when someone loses their phone and has no backup: that's the case this mission is about.",
    ],
  },
  persona: {
    passed: [
      "The personas are rooted in your interviews rather than assumptions. The flow map clearly shows where trust breaks down.",
      "Great synthesis. The 'weekly savings' moment in the flow is a strong opportunity to design for.",
    ],
    revision: [
      "The persona reads a bit generic. Pull in two or three direct quotes from your interviews and tie each step of the flow to a need.",
    ],
  },
  triage: {
    passed: [
      "Exactly how a maintainer would want an issue triaged: reproduction, labels and a clear next step. Ready to post.",
    ],
    revision: [
      "Good issue choice. Before posting, add steps to reproduce and check whether a similar issue already exists in the tracker.",
    ],
  },
};

export type DemoCohortKey = "cohort01" | "pilot" | "oss";

export type DemoSession = {
  cohort: DemoCohortKey;
  /** Week of the cohort, from 1. Sessions run on Thursday at 17:00 Lagos time. */
  week: number;
  title: string;
  description: string;
  host: string;
  moduleTitle?: string;
  recorded?: boolean;
};

export const DEMO_SESSIONS: DemoSession[] = [
  { cohort: "pilot", week: 1, title: "Pilot kickoff", description: "Meet the mentors and walk through how the pilot works.", host: "Kemi Adeyemi", recorded: true },
  { cohort: "pilot", week: 4, title: "Wallet audit clinic", description: "Bring your audit in progress for live feedback.", host: "Zainab Bello", moduleTitle: "Bitcoin UX Principles", recorded: true },
  { cohort: "pilot", week: 8, title: "Personas from real interviews", description: "Turning interview notes into personas you can design for.", host: "Zainab Bello", moduleTitle: "Designing for Bitcoin", recorded: true },
  { cohort: "pilot", week: 12, title: "Demo day", description: "Pilot participants present their best work to the community.", host: "Kemi Adeyemi", recorded: true },

  {
    cohort: "cohort01",
    week: 1,
    title: "Kickoff: how this cohort works",
    description: "Meet your mentors and cohort, and see how lessons, missions and reviews fit together. Bring one question about Bitcoin you've always wanted answered.",
    host: "Kemi Adeyemi",
    moduleTitle: "What is Bitcoin?",
    recorded: true,
  },
  {
    cohort: "cohort01",
    week: 2,
    title: "Money mental models",
    description: "What makes money useful, and how Bitcoin compares with mobile money and bank transfers people already use.",
    host: "Yaw Mensah",
    moduleTitle: "Bitcoin and Money",
    recorded: true,
  },
  {
    cohort: "cohort01",
    week: 3,
    title: "Wallet UX audit clinic",
    description: "Live walkthrough of a wallet audit, then breakout feedback on your drafts before Sunday's deadline.",
    host: "Zainab Bello",
    moduleTitle: "Bitcoin UX Principles",
    recorded: true,
  },
  {
    cohort: "cohort01",
    week: 4,
    title: "Backup and recovery deep dive",
    description: "Why most people never back up their wallet, and patterns that help. We'll critique three real backup flows.",
    host: "Kemi Adeyemi",
    moduleTitle: "Bitcoin Wallets",
    recorded: true,
  },
  {
    cohort: "cohort01",
    week: 5,
    title: "Portfolio review: audits and redesigns",
    description: "Mentors review four volunteers' work live and talk through how to present it in a portfolio.",
    host: "Yaw Mensah",
  },
  {
    cohort: "cohort01",
    week: 6,
    title: "Personas for Bitcoin products",
    description: "How to turn interviews into personas and a core flow map. Come with your interview notes.",
    host: "Kemi Adeyemi",
    moduleTitle: "Designing for Bitcoin",
  },
  {
    cohort: "cohort01",
    week: 7,
    title: "Onboarding flows critique",
    description: "We'll compare onboarding in four wallets popular in Nigeria, Ghana and Kenya.",
    host: "Zainab Bello",
    moduleTitle: "Bitcoin Onboarding Flows",
  },

  {
    cohort: "oss",
    week: 1,
    title: "Open Source Lab kickoff",
    description: "How Bitcoin open source projects work and how designers fit in.",
    host: "Chinedu Okafor",
    moduleTitle: "How Bitcoin open source works",
    recorded: true,
  },
  {
    cohort: "oss",
    week: 4,
    title: "Reading an issue like a maintainer",
    description: "We triage real issues together and practise writing clear, kind comments.",
    host: "Amara Nwosu",
    moduleTitle: "Your first design contribution",
  },
];

/** A real talk used as the recording for every demo session. Replace with your own recordings. */
export const DEMO_RECORDING_URL = "https://www.youtube.com/watch?v=bBC-nXj3Ng4";
export const DEMO_MEETING_URL = "https://meet.google.com/bdx-wkly-crit";

export type DemoAnnouncement = {
  audience: DemoCohortKey | "global";
  /** A staff name, or "admin" for the super admin running the seed. */
  author: string;
  /** Days after the start of Cohort 01. Announcements are inserted in this order. */
  day: number;
  title: string;
  body: string;
};

export const DEMO_ANNOUNCEMENTS: DemoAnnouncement[] = [
  {
    audience: "pilot",
    author: "Kemi Adeyemi",
    day: -100,
    title: "Congratulations, pilot cohort!",
    body: "Thank you for being our first cohort. Certificates are on your profiles, and your feedback has shaped everything about Cohort 01.\n\nYou keep access to all the lessons and your work. Stay in touch on Discord.",
  },
  {
    audience: "global",
    author: "admin",
    day: -3,
    title: "Welcome to the new BitDesigners platform",
    body: "Lessons, missions, reviews and live sessions now live in one place.\n\n- **Learn** has the full curriculum\n- **Missions** is where you hand in work and get mentor feedback\n- **Live** has the session schedule and recordings\n\nSet up your profile so your cohort can get to know you.",
  },
  {
    audience: "cohort01",
    author: "Kemi Adeyemi",
    day: 0,
    title: "Week 1: start here",
    body: "Welcome to Cohort 01! This week:\n\n1. Work through **What is Bitcoin?**\n2. Do the *Explain Bitcoin to a friend* mission (due Sunday)\n3. Join Thursday's kickoff at 17:00 WAT\n\nIntroduce yourself in Discord too.",
  },
  {
    audience: "cohort01",
    author: "Yaw Mensah",
    day: 15,
    title: "Wallet UX audit due Sunday",
    body: "Reminder that the **Wallet UX audit** is due this Sunday. Test on the cheapest phone you can borrow; that's where the interesting problems are.\n\nThursday's clinic is the best place to get early feedback.",
  },
  {
    audience: "oss",
    author: "Chinedu Okafor",
    day: 14,
    title: "Welcome to Open Source Lab",
    body: "Glad to have you. Our first goal is simple: by week 4, everyone has triaged a real issue on a Bitcoin project.\n\nIf you've never used GitHub, start with the **How Bitcoin open source works** module.",
  },
  {
    audience: "global",
    author: "admin",
    day: 31,
    title: "Bitcoin Design Community call this Friday",
    body: "The Bitcoin Design Community holds an open call this Friday at 16:00 UTC. It's a great way to see how design decisions get made in open source. Everyone is welcome.",
  },
  {
    audience: "cohort01",
    author: "Kemi Adeyemi",
    day: 36,
    title: "Week 6: personas and the halfway check-in",
    body: "We're halfway! This week is about **personas and core flows**, using the interviews many of you ran in week 4.\n\nThe *Persona and core flow map* mission is due next Monday. Mentors will also message each of you for a short halfway check-in.",
  },
];

export const OSS_CURRICULUM = {
  unit: {
    title: "Open Source Foundations",
    description: "How Bitcoin open source projects are run, and how designers contribute.",
  },
  modules: [
    {
      title: "How Bitcoin open source works",
      description: "Maintainers, contributors, issues and pull requests: who does what.",
      objectives: ["Explain how decisions get made in a Bitcoin open source project", "Find your way around a GitHub repository"],
      lessons: [
        {
          title: "Who runs an open source project?",
          summary: "Maintainers, contributors and users, and how they work together.",
          body: "## Who runs an open source project?\n\nMost Bitcoin projects are run by a small group of **maintainers** who review and merge changes. Anyone can be a **contributor**: open an issue, comment, or propose a change.\n\nDesigners are rare in most repositories, which means good design input is noticed and valued.\n\n### What maintainers care about\n\n- Changes that are small and easy to review\n- Clear reasoning, not just nice visuals\n- Respect for the project's existing decisions\n\n> Open source runs on trust. You build it by being useful, clear and patient.",
        },
        {
          title: "Finding your way around GitHub",
          summary: "Issues, pull requests, labels and discussions.",
          body: "## Finding your way around GitHub\n\nEvery repository has the same building blocks:\n\n| Part | What it's for |\n|---|---|\n| Issues | Bugs, ideas and questions |\n| Pull requests | Proposed changes to the code or docs |\n| Labels | How maintainers sort issues, e.g. `design`, `good first issue` |\n| Discussions | Longer conversations that aren't tasks yet |\n\nStart by searching for issues labelled **design** or **UX** in a wallet you use.",
        },
      ],
    },
    {
      title: "Your first design contribution",
      description: "From spotting a problem to a well-written issue a maintainer can act on.",
      objectives: ["Write an issue a maintainer can act on", "Triage an existing issue with evidence"],
      lessons: [
        {
          title: "Anatomy of a great design issue",
          summary: "Problem, evidence, proposal, and what you need from maintainers.",
          body: "## Anatomy of a great design issue\n\nA strong design issue has four parts:\n\n1. **The problem**, in one sentence, from the user's point of view\n2. **Evidence**: screenshots, steps to reproduce, quotes from users\n3. **A proposal**, kept small, with a mockup if it helps\n4. **The ask**: feedback, a decision, or help implementing\n\nKeep it short. Maintainers read a lot of issues.",
        },
        {
          title: "Triage: helping maintainers help you",
          summary: "Reproducing, labelling and linking existing issues.",
          body: "## Triage\n\nTriage is one of the most valuable things a newcomer can do. For an open issue:\n\n- Try to **reproduce** it and say whether you could\n- Check for **duplicates** and link them\n- Suggest **labels** and a possible next step\n\nGood triage saves maintainers hours, and it's the fastest way to get known in a project.",
        },
      ],
    },
  ],
  mission: {
    moduleTitle: "Your first design contribution",
    title: MISSION_TITLES.triage,
    brief: "Pick an open issue in a Bitcoin wallet or the Bitcoin Design Guide that touches design or UX.\n\nTriage it as if you were helping the maintainers: reproduce it, look for duplicates, and write a short comment with suggested labels and a next step. **Don't post it yet**: submit a link to your draft so a mentor can review it first.",
    rubric: ["Reproduces the problem or explains why it can't be reproduced", "Checks for duplicates", "Suggests labels and a concrete next step"],
    dueWeek: 2,
  },
};
