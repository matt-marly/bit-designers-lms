# GitHub for Designers

> BitDesigners · Research & Contribute Materials · ≈20 min read · Pairs with Lesson 7

The promise of this guide: **just enough GitHub to contribute design to open-source Bitcoin projects, and nothing more.** You will not write code. You will not touch a terminal. Everything here happens in the browser. By the end you can find a project's design conversations, join them credibly, and propose your own work.

## 1. Reframe: GitHub Is a Forum With Files Attached

Designers freeze at GitHub because it looks like a developer tool. Ignore 90% of it. For your purposes, GitHub is three things:

- A **repository** ("repo") is a project's home folder: its files plus its entire public conversation.
- An **issue** is a forum thread: a bug, an idea, a request, a design problem. Issues are where design happens in the open.
- A **pull request** ("PR") is a proposed change to the project's files, with its own discussion thread. Some day one of these may carry your design into the product; for docs and the Design Guide, you can even create simple PRs from the browser.

That's the whole mental model. Repos hold conversations; issues are the conversations; PRs are conversations that end in a change.

## 2. Setup (15 minutes, once)

1. **Profile:** you have an account from onboarding. Now make it credible: real photo or consistent avatar, name you go by professionally, bio that says "Product designer · [city]", and links to your portfolio and your published Gate 3 audit. Maintainers will look; a filled profile reads as a real person, an empty one reads as a drive-by.
2. **Notifications:** github.com/settings/notifications → email for "Participating, @mentions". You want replies to reach you without drowning you.
3. **Watch your first repos:** on a repo page, the "Watch" button → "Participating and @mentions" (or "All activity" for one or two projects you care most about). Start with BitcoinDesign/Guide.
4. **Stars are bookmarks with a hint of applause.** Star the projects on your candidate list; your stars page becomes your working list.

## 3. Reading a Project Like a Designer

Before you post anything in a repo, spend 30 minutes reading. In this order:

1. **README** (the repo's front page): what the project is, how they talk about themselves.
2. **CONTRIBUTING.md** if it exists: the house rules. Following a project's stated conventions is the single highest-signal thing a newcomer can do.
3. **Issues tab → filter and search.** Type `label:design` in the filter box, or search words like "UX", "flow", "onboarding", "confusing". Sort by recently updated. Read 5–10 threads: who decides here, what tone works, what happened to past design suggestions.
4. **Closed issues too.** How ideas die in a project teaches you more than how they're born. Was it "out of scope"? "No capacity"? Silence? Calibrate accordingly.
5. **Discussions tab** (some repos): looser conversation; often the right door for a broad UX observation that isn't yet a concrete issue.

## 4. Participating: Comments That Land

Your first act (this week's assignment) is a substantive comment on a live issue. The anatomy of one that lands:

- **Add evidence, not just agreement.** "+1" is noise. "I hit this too: on a Tecno Spark with Opera Mini, this screen clips the fee row (screenshot attached)" is signal.
- **Bring your research.** You own something rare now: a published audit with real user evidence. "In a usability test with 4 first-time users, 3 stalled at this exact step" changes conversations.
- **Screenshots and annotations inline.** Drag images straight into the comment box. Annotated beats raw.
- **Ask before assuming.** "Is the current behavior intentional for [reason]?" respects that constraints you can't see may exist. Half of them do.
- **Formatting basics** (the only Markdown you need): blank line between paragraphs, `**bold**`, `-` for bullets, `>` to quote, drag-drop for images. Preview tab before posting.

House rule from our program: never open with criticism of work you haven't tried to understand. Read the thread history first; someone may have already proposed your idea in 2023 — and acknowledging that ("building on what @name suggested earlier...") earns more than pretending novelty.

## 5. Sharing Figma Work in Issues

- **View-only link, always:** Share → "Anyone with the link" → "can view". Test it in a private browser window; a link that demands login kills your proposal's momentum.
- **Never a link alone.** Maintainers triage dozens of threads; many won't click. Post 1–3 exported frames inline as images, with the Figma link beneath for those who want depth.
- **Name your file like a professional artifact:** "ProjectName: Send flow proposal (BitDesigners audit follow-up)", not "Untitled (Copy) (2)".
- **Keep the file self-explanatory:** a title frame stating the problem and evidence, then the flow. Assume it's viewed with you not in the room — because it will be.

## 6. Opening Your Own Issue (a Design Proposal)

When you graduate from commenting to proposing (Lesson 8's territory, previewed here):

1. **Search first; duplicates cost credibility.** If a related issue exists, comment there instead.
2. Use the project's issue template if offered.
3. **Title as problem, not solution:** "First-time users can't find the backup option" travels further than "Redesign the settings page."
4. **Body structure:** Problem (with your evidence) → Proposal (frames inline + Figma link) → Open questions (2–3, genuinely open). Proposals that invite critique get engagement; proposals that arrive finished get silence.
5. Then be patient, and see the silence protocol in the Contribution Playbook.

## 7. Glossary (all of it)

- **Repo** — a project's home: files plus conversations
- **Issue** — a public thread about one problem or idea
- **PR (pull request)** — a proposed change under discussion
- **Maintainer** — person with merge power; your actual audience
- **Label** — a tag on issues (`design`, `good first issue`)
- **Fork** — your own copy of a repo (needed for PRs; browser handles it when editing docs)
- **Merge** — a proposal becoming part of the project
- **"Bump"** — thread etiquette term: don't; see the Playbook's silence protocol instead

---

*Pairs with: Contribution Playbook (where to contribute and how proposals are structured) and the Lesson 7 session on open design culture.*
