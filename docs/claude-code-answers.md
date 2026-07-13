# Claude Code — Open Items Answers

> Resolved answers to all §14 open items from bitdesigners-discovery.md.
> These are fixed decisions. Do not re-ask them.

## 1. Applications & Screening
Handled externally (Typeform / Tally). Not built inside the platform.
V1 needs two things only:
- Invite generation — admin creates a track-specific invite link (Design Lab or Open Source Lab).
- Invite-gated signup — invite link sets the learner's track and cohort on account creation.

## 2. Top-Level Nav
Home · Learn · Missions · Live · Resources · Community

## 3. Community
External. No discussion or feed system in V1.
Platform has: member directory + portfolio showcase.
Community lives on Discord. Platform links out.

## 4. Team & Timeline
1–2 builders + Claude Code. Plan for 12 weeks, aim for 8.

## 5. Video Hosting
YouTube unlisted embeds. Free. No Cloudflare Stream.
- Platform stores a YouTube URL per lesson in lessons.video_url.
- Lesson page renders embedded YouTube player (rel=0, modestbranding=1).
- YouTube handles adaptive bitrate — solves low-bandwidth at zero cost.
- Unlisted = not publicly searchable.

## 6. Infra Budget
Target $0/month. All free tiers.
Supabase · Vercel · Cloudflare R2 · Resend (≤100/day) · YouTube

## 7. PRD Fixes (apply to prd.md)
- Foundations complete = all modules in Unit 01 marked complete.
- Certificate trigger = all modules complete + all reviewed-type missions passed.
- Showcase = global (all cohorts, all passed deliverables).
- Directory = cohort-scoped for learners.

## 8. Architecture Fixes (apply to architecture.md)
- MDX pipeline = next-mdx-remote only. Not contentlayer.
- Write explicit RLS policies before schema migration:
  Learners read rows where cohort_id matches their enrollment.
  Mentors read submissions where cohort_id is in their enrolled cohorts.
  Admins bypass all RLS.
  Alumni read-only on resources, showcase, directory.
