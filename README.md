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

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Convex (database + server functions)
- **Auth:** Clerk
- **Storage:** Convex file storage (submissions, avatars, PDF materials)
- **Email:** Clerk (invitation emails); everything else is in-app notifications
- **Video:** YouTube / Vimeo embeds
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
    notifications/
    profile/
  welcome/         # One-time onboarding after first sign-in
  certificates/    # Public, printable certificates (/certificates/[code])
  admin/           # Admin/mentor experience
    tracks/        # Tracks, cohorts and staff
    curriculum/
    members/
    invites/
    review/
    announcements/
    sessions/
    resources/
convex/            # Convex schema + backend functions
docs/              # Product documentation
  bitdesigners-discovery.md
  prd.md
  architecture.md
  design-system.md
components/
  ui/custom/       # Design system components
lib/               # Client utilities (time, sessions, uploads, video)
```

## Docs

All product decisions are documented in `docs/`.
Read these before contributing:

- `docs/prd.md` — Product requirements
- `docs/architecture.md` — System architecture
- `docs/design-system.md` — Design system spec
- `docs/BitDesigners_Africa_Brand_Direction.md` — Brand

## Development

Copy `.env.example` to `.env.local` and fill in the Convex and Clerk keys.

The platform is invite-only: people join by accepting an email invitation
sent from **Admin → Invites**. What they can do is decided by the
inviter (see "Permissions" in `docs/architecture.md`).

One-time setup:

1. In the Clerk dashboard:
   - Enable email + password sign-in.
   - Set **Configure → Restrictions → Sign-up mode** to **Restricted**,
     so only invited people can create accounts.
   - Activate the **Convex** integration (creates a JWT template named
     `convex`), and make sure its claims include
     `"email": "{{user.primary_email_address}}"` and
     `"email_verified": "{{user.email_verified}}"`.
2. Set the Convex environment variables:

   ```bash
   bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
   bunx convex env set CLERK_SECRET_KEY sk_test_...
   bunx convex env set SITE_URL http://localhost:3002   # where /accept-invite lives
   ```

3. Seed the tracks and a first cohort:

   ```bash
   bunx convex run seed:tracks
   bunx convex run seed:cohort '{"trackSlug":"design_lab","name":"Cohort 01"}'
   bunx convex run seed:curriculum   # optional: sample Design Lab units, modules and lessons
   bunx convex run seed:missions     # optional: sample missions, due 1–6 weeks into each cohort
   bunx convex run seed:resources    # optional: starter Materials and Reference entries
   bunx convex run seed:roadmaps     # optional: starter global guide in the roadmaps library
   ```

   `seed:missions` attaches to the sample modules by title, so run it after
   `seed:curriculum` and after creating cohorts. Running it again skips
   missions that already exist. `seed:resources` skips entries whose title
   already exists.

4. Invite yourself as the first super admin. Clerk emails you a link to
   `/accept-invite`:

   ```bash
   bunx convex run seed:bootstrapSuperAdmin '{"email":"you@example.com"}'
   ```

   If you already have an account, promote it instead:
   `bunx convex run seed:makeSuperAdmin '{"email":"you@example.com"}'`

5. Optional, dev only: fill the platform with simulated people and activity
   (mentors, a graduated pilot cohort with certificates, Cohort 01 in week 6,
   an Open Source Lab cohort, reviews, sessions, announcements and
   notifications). Run it after step 3:

   ```bash
   bunx convex run demo:seed    # runs once; later runs are skipped
   bunx convex run demo:clear   # removes every demo user and everything they created
   ```

   Demo users have `@example.com` emails and cannot sign in. The seed moves
   Cohort 01's start date to five weeks before the current week and adds the
   Open Source Lab curriculum if that track has none. Convex sets creation
   times itself, so seeded submissions and announcements show as "just now".

Run the Convex backend and the Next.js app in two terminals:

```bash
bun install
bunx convex dev
bun run dev -- -p 3002
```

Open [http://localhost:3002](http://localhost:3002)
for the learner dashboard.

Open [http://localhost:3002/admin](http://localhost:3002/admin)
for the admin dashboard.

Every page needs a signed-in account except `/login`, `/accept-invite` and
`/certificates/[code]`. Certificates are public so learners can share them;
they show only the name, track, cohort and date (see `proxy.ts`).

### Tests

The permission rules, curriculum, missions, reviews, profiles, live sessions, announcements,
notifications, resources, community and certificates are covered by backend tests that run against an
in-memory Convex (`convex-test` + Vitest), so they need no deployment or network:

```bash
bun run test        # once
bun run test:watch  # re-run on save
```

Tests live next to the code as `convex/*.test.ts`, with shared fixtures in
`convex/test.setup.ts`. Convex doesn't deploy files with more than one dot in
the name, so neither ends up in the backend.

## Status

V1 feature-complete. Not yet deployed.

---

Built by [BitDesigners Africa](https://bitdesigners.africa)
