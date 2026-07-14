# BitDesigners Africa — Design System Spec v1.1

**v1.1 change:** color system aligned to the official brand direction — true-neutral dark surfaces, indigo (`#6366F1`) as the interactive/learning accent, Bitcoin orange (`#F7931A`) restricted to Bitcoin content only. Typography, spacing, components, motion, and layout are unchanged.

**Purpose:** Component-level specification for the BitDesigners Africa learning dashboard rebuild. This document is the single source of truth. Every value is exact and intentional — do not substitute, round, or "improve" values during implementation.

---

## 0. Design Direction (read before building)

The current UI is a generic dark dashboard: indigo and amber used interchangeably with no rules, and identical cards with no hierarchy. The redesign keeps the brand's palette but gives every color exactly one job, in the register the brand direction names — Linear, Vercel, Raycast: serious, technical, calm.

Three governing decisions:

1. **True-neutral dark canvas.** Surfaces are pure grayscale — `#090909` page, `#111111` cards — separated by hairline `#242424` borders. No color cast, no gradients, no shadows on cards. Depth comes from grayscale surface steps, which is what produces the calm, premium register the brand calls for.

2. **Two accents, two meanings — never interchangeable.** Indigo (`#6366F1`) owns everything interactive and everything about the learning journey: primary buttons, progress, active states, focus rings. Bitcoin orange (`#F7931A`) appears *only* on Bitcoin itself — BTC balances, sats, rewards, Bitcoin badges. The test an implementer can apply: **if it's clickable, it's indigo or grayscale; if it's orange, it's Bitcoin.** Orange on UI chrome is a bug.

3. **Monospace is the system's voice for data.** All metadata, section labels, stats, timestamps, and counters are set in a monospace face, uppercase, letterspaced — a quiet terminal register that encodes "this is machine truth" (week counts, module numbers, due dates) vs. the humanist sans that carries editorial content. This contrast is the signature of the system.

---

## 1. Typography

### 1.1 Typefaces

| Role | Family | Fallback stack | Usage |
|---|---|---|---|
| Display | **Space Grotesk** | `'Space Grotesk', 'Inter', system-ui, sans-serif` | Page titles, card headlines, stat-adjacent headings |
| Body / UI | **Inter** | `'Inter', system-ui, -apple-system, sans-serif` | Body copy, buttons, inputs, nav, descriptions |
| Data / Label | **JetBrains Mono** | `'JetBrains Mono', 'SF Mono', monospace` | Section labels, stats, metadata, timestamps, counters, pills |

Load weights only as listed below. Do not load additional weights.
- Space Grotesk: 500, 600
- Inter: 400, 500, 600
- JetBrains Mono: 400, 500, 600

Enable `font-feature-settings: 'ss01'` on Inter (open digits) and `font-variant-numeric: tabular-nums` on **all** JetBrains Mono usage.

### 1.2 Type scale

All sizes in px with rem equivalent (root = 16px). Letter-spacing in em.

| Token | Family | Size | Line height | Weight | Tracking | Use case |
|---|---|---|---|---|---|---|
| `display-xl` | Space Grotesk | 36 / 2.25rem | 42px | 600 | −0.02em | Page greeting ("Good morning, Amara"). One per page, max. |
| `display` | Space Grotesk | 26 / 1.625rem | 32px | 600 | −0.015em | Featured card headlines ("Bitcoin as a Design Medium") |
| `heading` | Space Grotesk | 20 / 1.25rem | 26px | 600 | −0.01em | Card titles, modal titles |
| `title` | Inter | 16 / 1rem | 22px | 600 | −0.005em | List-item titles, nav section titles, toast titles |
| `body` | Inter | 14.5 / 0.906rem | 22px | 400 | 0 | Default body copy, descriptions, input values |
| `body-medium` | Inter | 14.5 / 0.906rem | 22px | 500 | 0 | Buttons, nav items, emphasized inline text |
| `body-sm` | Inter | 13 / 0.813rem | 19px | 400 | 0 | Secondary descriptions, helper text, toast body |
| `data-xl` | JetBrains Mono | 30 / 1.875rem | 34px | 600 | −0.02em | Stat values ("Week 3", "7", "2") |
| `data` | JetBrains Mono | 13 / 0.813rem | 18px | 500 | 0 | Inline metadata ("Unit 01 · Module 03"), timestamps, due dates |
| `label` | JetBrains Mono | 11 / 0.688rem | 14px | 600 | +0.10em | Section labels, pills, badges, nav group headers. **Always uppercase.** |
| `micro` | JetBrains Mono | 10 / 0.625rem | 12px | 500 | +0.06em | Avatar initials, keyboard hints, counters. Always uppercase. |

**Rules:**
- Never use Space Grotesk below 20px. Never use JetBrains Mono for sentences longer than ~6 words.
- Body copy max line length: 68ch.
- No font-weight 700 anywhere. Bold hierarchy is achieved by 600 + size + color, not heavier weights.

---

## 2. Color

True-neutral dark mode. Surfaces are pure grayscale — no warm or cool cast. Two accents with fixed meanings: **indigo = learning & product (all interaction)**, **orange = Bitcoin (content only, sparingly)**.

### 2.1 Palette tokens

**Surfaces**

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#090909` | Page background. The only place this appears. |
| `bg-surface` | `#111111` | Cards, sidebar, modals |
| `bg-surface-2` | `#181818` | Nested elements: input fields inside cards, hover states |
| `bg-surface-3` | `#202020` | Active/pressed states, selected nav item |

**Borders**

| Token | Value | Usage |
|---|---|---|
| `border-subtle` | `#242424` | Default card and divider border (brand-specified) |
| `border-strong` | `#333333` | Inputs, hovered cards, outline buttons |
| `border-focus` | `rgba(129,140,248,0.90)` | Focus rings — indigo, all components |

**Text**

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `#FFFFFF` | Headings, primary content |
| `text-secondary` | `#B5B5B5` | Descriptions, body copy, inactive nav |
| `text-tertiary` | `#737373` | Metadata, placeholders, disabled text, micro labels |
| `text-on-accent` | `#FFFFFF` | Labels on indigo fills |
| `text-inverse` | `#090909` | Reserved: text on light fills (rare — e.g. light tooltips) |

**Interactive accent — Indigo (learning & product)**

| Token | Value | Usage |
|---|---|---|
| `indigo` | `#6366F1` | Primary buttons, progress bars, active-nav marker, links |
| `indigo-hover` | `#777AF5` | Hover on indigo fills |
| `indigo-active` | `#5558DA` | Pressed state on indigo fills |
| `indigo-subtle` | `rgba(99,102,241,0.12)` | Tinted backgrounds (pills, badges) |
| `indigo-border` | `rgba(99,102,241,0.35)` | Borders on indigo-tinted elements |
| `indigo-text` | `#A5B4FC` | Indigo text on dark. Never use raw `#6366F1` as text — 3.9:1, fails at small sizes. |

**Bitcoin accent — content only, use sparingly**

| Token | Value | Usage |
|---|---|---|
| `btc` | `#F7931A` | BTC balances, sats counters, rewards, Bitcoin badges. **Never UI chrome.** |
| `btc-subtle` | `rgba(247,147,26,0.10)` | Tinted backgrounds for Bitcoin badges/pills |
| `btc-border` | `rgba(247,147,26,0.30)` | Borders on Bitcoin-tinted elements |
| `btc-text` | `#FFB45E` | Orange text on dark. Never raw `#F7931A` as text — 4.1:1, fails at small sizes. |

**Status**

| Token | Base | Subtle bg | Border | Text-on-dark |
|---|---|---|---|---|
| `success` | `#22C55E` | `rgba(34,197,94,0.10)` | `rgba(34,197,94,0.30)` | `#4ADE80` |
| `warning` | `#F59E0B` | `rgba(245,158,11,0.10)` | `rgba(245,158,11,0.30)` | `#FBBF24` |
| `danger` | `#EF4444` | `rgba(239,68,68,0.10)` | `rgba(239,68,68,0.30)` | `#F87171` |

**Color meaning (fixed vocabulary — brand-level)**

| Color | Meaning |
|---|---|
| Indigo | Learning & product — everything interactive |
| Orange | Bitcoin — and nothing else |
| Green | Completion |
| Amber | Deadlines & attention |
| Red | Issues & errors |
| Purple | Reserved for future AI features — **do not use** |

### 2.2 Color usage rules

**Do:**
- Indigo is the *only* hue permitted on interactive chrome: buttons, focus rings, active-nav markers, progress, links.
- Use `text-secondary` as the default reading color; reserve `text-primary` (`#FFFFFF`) for what the eye should land on first.
- Tint any accent/status background at 10–12% opacity with its 30–35% border. This pairing is fixed.
- Keep ≥90% of any screen within the grayscale surface + text tokens. Accents should be countable at a glance. Bitcoin orange should be countable on one hand across the entire app.

**Never:**
- Never use orange on buttons, links, focus rings, progress bars, or active states — orange means Bitcoin, not "brand."
- Never use raw `#6366F1` or `#F7931A` as text on dark surfaces. Use `indigo-text` / `btc-text`.
- Never place two accent/status hues inside the same element. (A `btc` Badge sitting inside an indigo-labeled card is fine — those are separate elements.)
- Never use gradients. Anywhere. Depth comes from surface steps and borders.
- Never use colored shadows or glows.
- Never introduce purple — it is reserved.

---

## 3. Spacing, Radius, Elevation

### 3.1 Spacing scale (4px base)

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gaps inside pills |
| `space-2` | 8px | Gaps inside buttons, label-to-value |
| `space-3` | 12px | Between related text lines, pill padding |
| `space-4` | 16px | Between elements inside a card, grid gutters (mobile) |
| `space-5` | 20px | Card padding (compact) |
| `space-6` | 24px | Card padding (default), grid gutters (desktop) |
| `space-8` | 32px | Page padding (desktop), between card internal sections |
| `space-10` | 40px | — reserved — |
| `space-12` | 48px | Between page sections |
| `space-16` | 64px | Above/below page header zone |

No off-scale values. If a design calls for 18px, it's wrong — use 16 or 20.

### 3.2 Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Badges, skeleton bars, small controls |
| `radius-md` | 10px | Buttons, inputs, nav items, toasts |
| `radius-lg` | 14px | Cards, modals |
| `radius-full` | 999px | Pills, avatars, progress bars |

### 3.3 Elevation

Dark UIs get depth from surface color, not shadow. Only two shadows exist:

| Token | Value | Use |
|---|---|---|
| `shadow-overlay` | `0 16px 40px rgba(0,0,0,0.55)` | Modals, dropdowns, toasts |
| `shadow-none` | none | Everything else, including all cards |

---
## 4. Component Anatomy

Conventions used below: padding written as `top/right/bottom/left` shorthand or `Y × X`. All transitions reference §5 motion tokens.

### 4.1 Card

The workhorse container. Cards are flat — separation comes from border + surface step.

**Anatomy (top → bottom):**
1. *(optional)* SectionLabel — see §4.4
2. Title — `heading` or `display` (featured cards only), `text-primary`
3. Metadata row — `data`, `text-tertiary`, items separated by ` · ` (space-dot-space, `text-tertiary`)
4. Body / content zone
5. *(optional)* Action row — buttons left-aligned, `space-2` gap

**Spec:**
- Background: `bg-surface` · Border: 1px `border-subtle` · Radius: `radius-lg`
- Padding: `space-6` (24px) all sides. Featured/hero cards: `space-8` (32px).
- Vertical rhythm inside: SectionLabel → title: 12px. Title → metadata: 6px. Metadata → body: 20px. Body → actions: 24px.
- Interactive cards (whole card clickable): hover raises border to `border-strong` and background to `bg-surface-2`; cursor pointer; nothing moves or scales.
- Never nest a card inside a card. Nested containers use `bg-surface-2` with no border.

### 4.2 Button

Three variants. One size ramp. Labels are `body-medium`, sentence case, verb-first ("Continue learning", "Submit deliverable").

**Shared spec:**
- Height: 40px (default) · 32px (small) · 48px (large, hero cards only)
- Padding: 0 16px (default) · 0 12px (small) · 0 20px (large)
- Radius: `radius-md` · Gap between icon and label: `space-2` · Icon size: 16px (default/small), 18px (large)
- Focus: 2px ring `border-focus`, offset 2px. Same for all variants.
- Disabled: 40% opacity on the entire button, `cursor: not-allowed`. No color changes.
- Only one primary button per card/section.

**Primary** — indigo, the interaction color:
- Fill `indigo` (`#6366F1`) · label `text-on-accent` (`#FFFFFF`) · no border
- Hover: fill `indigo-hover` (`#777AF5`)
- Active: fill `indigo-active` (`#5558DA`)

**Outline:**
- Fill transparent · label `text-primary` · border 1px `border-strong`
- Hover: background `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.22)`
- Active: background `rgba(255,255,255,0.08)`

**Ghost:**
- Fill transparent · label `text-secondary` · no border
- Hover: background `rgba(255,255,255,0.05)`, label `text-primary`
- Active: background `rgba(255,255,255,0.08)`
- Use for tertiary actions and icon-only buttons (icon-only: 40×40, icon 18px).

### 4.3 StatusPill

Communicates state ("In progress", "Due in 3 days", "Passed").

**Anatomy:** [dot] [label]
- Height: 24px · Padding: 0 10px · Radius: `radius-full`
- Dot: 6px circle, solid status color, margin-right 6px
- Label: `label` token (11px mono, uppercase, +0.10em), status `*-text` color
- Background: status subtle bg · Border: 1px status border

**Mapping:** In progress / learning states → indigo. Due soon / needs attention → warning. Passed / complete → success. Overdue / failed → danger. Bitcoin-specific ("SATS EARNED") → btc. Neutral ("Draft") → no dot, `bg-surface-3`, `text-secondary`, `border-subtle`.

Pills are never interactive. If it's clickable, it's a small Button.

### 4.4 SectionLabel

The mono eyebrow that opens cards and page sections ("UP NEXT", "CURRENT MISSION").

- Type: `label` token, uppercase
- Color: `text-tertiary` by default. `indigo-text` **only** when the section marks the learner's current focus (e.g. CURRENT MISSION). `btc-text` **only** when the section is Bitcoin content itself (e.g. SATS EARNED). Never both treatments in the same region.
- Optional leading glyph: 12px icon or `▸`, same color, gap 6px
- Margin below: 12px. Never bold beyond 600. Never a background.

### 4.5 Input

- Height: 40px (single-line) · Padding: 0 14px · Radius: `radius-md`
- Background: `bg-surface-2` · Border: 1px `border-strong` · Text: `body`, `text-primary`
- Placeholder: `text-tertiary`
- Label above input: `label` token, `text-secondary`, margin-bottom 8px
- Helper/error text below: `body-sm`, margin-top 6px; `text-tertiary` for helper, `danger-text` for errors
- Focus: border becomes `rgba(99,102,241,0.70)`, plus 3px outer ring `rgba(99,102,241,0.15)`. Indigo, never orange.
- Error state: border `rgba(239,68,68,0.55)`; focus ring switches to `rgba(239,68,68,0.15)`
- Disabled: 40% opacity, background `bg-surface`
- Textarea: same tokens, padding 12px 14px, min-height 96px

### 4.6 Badge

Static descriptor (counts, categories, "NEW"). Distinct from StatusPill: no dot, no state semantics.

- Height: 20px · Padding: 0 8px · Radius: `radius-sm`
- Type: `micro` token, uppercase
- Default: `bg-surface-3`, `text-secondary`, 1px `border-subtle`
- Product variant ("NEW", "BETA", "LIVE"): `indigo-subtle` bg, `indigo-text`, `indigo-border`
- Bitcoin variant ("BTC", "SATS"): `btc-subtle` bg, `btc-text`, `btc-border`
- Numeric count in nav: 18×18 minimum, radius-full, `bg-surface-3`, `text-secondary`

### 4.7 Avatar

- Sizes: 24 / 32 / 40 px, radius-full
- Image: cover-fit, 1px inset border `rgba(255,255,255,0.10)` to hold shape on dark
- Fallback: `bg-surface-3` fill, initials in `micro` token, `text-secondary`. Never colored/generated backgrounds.
- Presence dot (optional): 8px, `success`, bottom-right, 2px `bg-base` ring

### 4.8 Navigation item (sidebar)

**Anatomy:** [icon 18px] [label] [optional count Badge, pushed right]

- Height: 40px · Padding: 0 12px · Radius: `radius-md` · Gap icon→label: 12px
- Full-width within a 260px sidebar that has 16px inner padding
- Label: `body-medium`
- Inactive: icon + label `text-secondary`, transparent bg
- Hover: bg `rgba(255,255,255,0.04)`, label `text-primary`
- Active: bg `bg-surface-3`, label + icon `text-primary`, plus a 2px × 16px vertical bar in `indigo`, radius-full, positioned at the item's left edge — the learning-journey marker, and the only accent in the nav
- Vertical gap between items: 2px. Nav group headers: `label` token, `text-tertiary`, padding 20px 12px 8px.

### 4.9 PageHeader

Opens every page. Left-aligned, no background, no border.

**Anatomy:**
1. Greeting/title: `display-xl`, `text-primary`
2. Context line: `data` token, `text-tertiary` — breadcrumb-style facts separated by ` · ` ("COHORT 1 · DESIGN LAB · WEEK 3 / 12", uppercase)
3. *(optional)* Action slot, right-aligned on the title row

**Spec:** Title → context gap: 10px. Header sits 48px below the top of the content area; 48px below it before the first section. On mobile, `display-xl` drops to 28px/34px.

### 4.10 Empty state

Centered in its container, max-width 360px.

**Anatomy (top → bottom, all centered):**
1. Icon: 40px, `text-tertiary`, inside a 72px circle of `bg-surface-2` with 1px `border-subtle`
2. Title: `title` token, `text-primary` — states the fact ("No missions yet")
3. Body: `body-sm`, `text-secondary`, max 2 lines — states what will change it ("Missions unlock when you complete Module 04.")
4. *(optional)* One button: outline or primary, never both

**Spacing:** icon → title 20px · title → body 8px · body → button 20px · container padding 48px vertical. Copy is directive, never apologetic ("Nothing here yet 😢" is banned).

### 4.11 Skeleton loader

- Shape mirrors the real component's blocks: bars of 12px height for text (radius-sm), full-size rounds for avatars, `radius-lg` blocks for cards
- Fill: `bg-surface-2` base with a shimmer overlay: linear sweep of `rgba(255,255,255,0.04)`, 1600ms linear, infinite, left→right
- Text skeleton widths: title 40%, body lines 100% / 100% / 60%
- Show skeletons only for loads expected >300ms; render them instantly (no fade-in); fade real content in over 180ms when it arrives
- Never skeleton buttons or labels — only content that varies per user

### 4.12 Toast notification

Bottom-right, 24px from edges. Width 360px fixed. Stacks upward, 8px gap, max 3 visible.

**Anatomy:** [status icon 18px] [text column: title + optional body] [dismiss ghost icon-button 28×28]
- Background: `bg-surface-2` · Border: 1px `border-strong` · Radius: `radius-md` · Shadow: `shadow-overlay` · Padding: 14px 16px
- Title: `title` at 14.5px (use `body-medium` weight 600), `text-primary`. Body: `body-sm`, `text-secondary`, max 2 lines.
- Icon color = status color; no tinted background on the toast itself
- Title mirrors the action's verb: "Publish" button → "Published" toast
- Auto-dismiss: 5000ms (success/informational), persistent until dismissed (danger). Timer pauses on hover.
- Enter: translateY(8px)→0 + fade, 240ms `ease-out-quart`. Exit: fade only, 160ms.

---

## 5. Motion

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120ms | Hover/active color and border changes |
| `duration-base` | 180ms | Focus rings, content fade-ins, nav state changes |
| `duration-enter` | 240ms | Toasts, modals, dropdowns entering |
| `duration-exit` | 160ms | Anything leaving the screen |
| `ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | All entrances and state changes (default) |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Progress bar width changes only |

### 5.2 Rules

**Animate:** background-color, border-color, color, opacity, transform (toasts/modals only), progress-bar width (600ms, `ease-in-out`).

**Never animate:** layout properties (width/height/margin/padding of in-flow elements), font-size, letter-spacing, box-shadow, cards on hover (no lift, no scale), page-to-page transitions, numbers counting up.

- Exits are always faster than entrances.
- Nothing on the page moves unless the user caused it, with two exceptions: skeleton shimmer and toast entrance.
- `prefers-reduced-motion: reduce` → all durations become 0ms and shimmer becomes a static `bg-surface-2` fill. Non-negotiable.

---

## 6. Layout

### 6.1 App frame

- Sidebar: 260px fixed, `bg-surface`, 1px right border `border-subtle`, inner padding 16px, logo zone height 64px
- Content area: fills remaining width, `bg-base`, independently scrollable
- Below 1024px: sidebar collapses to an off-canvas drawer (same spec, `shadow-overlay`)

### 6.2 Content column

- Max content width: **880px**, centered within the content area. The dashboard is a focused single column — no full-bleed sprawl.
- Page padding: 32px horizontal (desktop), 20px (≤768px)
- Vertical: 48px top before PageHeader, 64px bottom after last section

### 6.3 Grid

- 12-column grid within the 880px column, gutter 24px (desktop) / 16px (mobile)
- Stat cards: 3-up, each spanning 4 columns; stack to 1-up below 640px
- Featured cards (Up Next, Current Mission, Live Session): full 12 columns, always

### 6.4 Section rhythm

- Between page sections: `space-12` (48px)
- Between sibling cards in a section: 16px
- Sections have no headers of their own — the card's SectionLabel does that job. No dividers between sections; the 48px gap is the divider.

### 6.5 Stat card pattern (reference composition)

Within a default Card at `space-5` (20px) padding:
1. SectionLabel ("CURRENT WEEK") — `text-tertiary`
2. 12px gap
3. Value — `data-xl`, `text-primary`
4. 6px gap
5. Context — `data`, `text-tertiary` ("OF 12 WEEKS")

Progress-related stat values (and only those) may render in `indigo-text`. BTC balances render in `btc-text` — the stat grid is the primary sanctioned home for the Bitcoin accent.

---

## 7. Accessibility floor

- All text ≥ 4.5:1 contrast against its surface (the token pairs above already guarantee this; don't create new pairs without checking)
- Focus visible on every interactive element — the 2px `border-focus` ring, never `outline: none` without replacement
- Hit targets ≥ 40×40px (24px pills are non-interactive by rule §4.3)
- Icons never carry meaning alone; pair with text or `aria-label`
- Toasts announce via `role="status"` (informational/success) or `role="alert"` (danger)

---

*End of spec. When in doubt, the answer is: fewer colors, more space, monospace for facts.*
