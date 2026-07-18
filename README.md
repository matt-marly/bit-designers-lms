# BitDesigners Africa — Learning Platform

A web-based learning platform for African designers
entering the Bitcoin ecosystem. Built to produce
contributors, not graduates.

## What this is

BitDesigners Africa is building the pipeline for
African designers to become meaningful contributors
to Bitcoin open source. This platform is the
operating system for that mission.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth)
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Video:** YouTube (unlisted embeds)
- **Hosting:** Vercel

## Structure

```
app/
  (dashboard)/     # Learner experience
    home/
    learn/
    missions/
    live/
    materials/
    reference/
    community/
  admin/           # Admin/mentor experience
    overview/
    cohorts/
    members/
    invites/
    review/
    announcements/
    sessions/
docs/              # Product documentation
  bitdesigners-discovery.md
  prd.md
  architecture.md
  design-system.md
components/
  ui/custom/       # Design system components
lib/               # Mock data + utilities
```

## Docs

All product decisions are documented in `docs/`.
Read these before contributing:

- `docs/prd.md` — Product requirements
- `docs/architecture.md` — System architecture
- `docs/design-system.md` — Design system spec
- `docs/BitDesigners_Africa_Brand_Direction.md` — Brand

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
for the learner dashboard.

Open [http://localhost:3000/admin](http://localhost:3000/admin)
for the admin dashboard.

## Status

V1 in active development. Not yet deployed.

---

Built by [BitDesigners Africa](https://bitdesigners.africa)
