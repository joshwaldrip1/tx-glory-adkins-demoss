# TX Glory Adkins-DeMoss — Recruiting Website Design

**Date:** 2026-07-12
**Status:** Draft for review

## Purpose

A recruiting website for the TX Glory Adkins-DeMoss fastpitch softball team.
College scouts scan a single team QR code, land on the team roster, tap any
player's photo, and see that player's recruiting profile: stats, verified
metrics, photo, highlight video, and a way to make contact through an adult.

Parents self-manage their own child's profile through a login. New and edited
profiles are held for admin approval before they become visible to scouts.

## Non-Goals (YAGNI)

- No uploaded video files — highlight videos are embedded from YouTube/Hudl links.
- No public exposure of a minor's personal contact info — contact routes to a
  parent/guardian (and the team coach).
- No custom/self-hosted server — a managed backend (Supabase) provides auth,
  database, and storage.
- No build step / framework — plain HTML/CSS/JS + the Supabase JS SDK.

## Architecture

Two halves:

- **Frontend** — plain HTML/CSS/JS static files plus the Supabase JS SDK,
  deployed to GitHub Pages. No build step. Talks to Supabase directly from the
  browser using the public **anon key** (safe to expose; Row-Level Security is
  the actual guard).
- **Backend** — a Supabase project providing:
  - **Auth** — parent email/password accounts with email verification.
  - **Postgres database** — the `players` table.
  - **Storage** — a `player-photos` bucket.

### Data flow

- **Scout (anonymous):** roster page → Supabase returns `approved` players →
  tap a card → profile page loads that player by id.
- **Parent (authenticated):** sign up → create/edit their own player(s), upload
  a photo, paste a video link, enter guardian contact → save. Row is created/
  updated with `status = 'pending'`.
- **Admin (you):** flip `pending` → `approved` in the Supabase dashboard.

## Data model — `players` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key, default `gen_random_uuid()` |
| `owner_id` | uuid | FK → `auth.users`; a parent may own more than one player |
| `first_name` | text | displayed white in the name treatment |
| `last_name` | text | displayed gold; public roster may abbreviate to last initial (see privacy) |
| `jersey_number` | int | large corner display (e.g. #15) |
| `grad_year` | int | "Class of ____"; signals age without publishing DOB |
| `positions` | text[] | primary first, e.g. `{P,3B}` — drives which stat sections render |
| `bats_throws` | text | e.g. "L/R" |
| `height` | text | e.g. "5'6\"" |
| `weight` | text | e.g. "140 lbs" (optional) |
| `gpa` | numeric | e.g. 3.80 |
| `school` | text | high school (optional) |
| `hometown` | text | e.g. "Mildred, TX" (optional) |
| `stats` | jsonb | batting/offensive group (see below) |
| `metrics` | jsonb | fielding, base running, pitching, catching groups |
| `achievements` | text[] | career honors (All-State, All-American, MVP, All-District, Silver Slugger…) |
| `academics` | jsonb | honor roll, awards, academic interests |
| `bio` | jsonb | narrative: about-me, softball IQ, coachability, coach's note |
| `photo_path` | text | path in Storage `player-photos` bucket |
| `video_url` | text | YouTube/Hudl highlight embed link |
| `profile_url` | text | external full-stats link (GameChanger / NCSA), optional |
| `socials` | jsonb | opt-in handles (instagram…), family's choice; empty by default |
| `guardian_name` | text | contact routes to the adult |
| `guardian_email` | text | |
| `guardian_phone` | text | |
| `status` | text | `'pending' \| 'approved'`, default `'pending'` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | maintained on update |

**Deliberately omitted:** date of birth, player personal phone/email. Grad year
conveys recruiting class; contact routes through a guardian. This is the one
place the website intentionally diverges from the laminated flyers, which show
more personal data than is safe to publish on a crawlable public page.

### Metric groups (JSON, position-aware rendering)

Stored as JSON so blank fields cost nothing and new metrics need no migration.
The profile page renders a group's section **only when it applies**.

- **Batting / Offensive** (all players): AVG, OBP, SLG, HR, RBI, exit velocity,
  bat speed, pitches per AB.
- **Fielding / Defensive** (all): fielding %, arm velocity (mph), home-to-first.
- **Base Running / Athleticism** (all): home-to-first time, stolen bases, 60-yard.
- **Pitching** (only if `positions` includes `P`): pitch velocity, ERA, K/BB
  ratio, pitch arsenal (FB/CH/CU/Rise…), movement notes.
- **Catching** (only if `positions` includes `C`): pop time, throw velocity,
  caught-stealing %, framing/blocking notes.
- **Career achievements** (all): honors list rendered as gold-star bullets.
- **Academic highlights** (all): GPA, honor roll, awards, academic interests.
- **Scouting narrative** (all, free text): softball IQ, coachability/character,
  coach's note.

## Security — Row-Level Security (RLS)

RLS is enabled on `players`. Policies:

- **Public read:** `SELECT` allowed only where `status = 'approved'`.
- **Owner read:** an authenticated parent may `SELECT` their own rows
  (`owner_id = auth.uid()`) regardless of status (to see pending profiles).
- **Owner insert:** `INSERT` allowed with `owner_id = auth.uid()`; new rows are
  forced to `status = 'pending'`.
- **Owner update/delete:** allowed only where `owner_id = auth.uid()`.
- **Approval:** only the admin (via Supabase dashboard / service role) sets
  `status = 'approved'`. Parents cannot self-approve. An edit by a parent may
  optionally reset `status` to `'pending'` for re-review.

**Storage `player-photos` bucket:** public read; a parent may upload/replace
only photos under paths for players they own.

Accounts use email verification so each account ties to a real inbox. The anon
key is public by design; all protection is enforced server-side by RLS.

## Visual design / brand

Derived from the team's existing player flyers (see `assets/reference/`).
Example 1 (Charley Waldrip) is the reference layout for the profile page.

**Color tokens (CSS custom properties):**
```
--bg:        #0E0E0E   /* page background, near-black */
--panel:     #1A1A1A   /* stat panels / cards */
--panel-2:   #232323   /* raised elements, table stripes */
--gold:      #C9A24B   /* primary accent, labels, last name */
--gold-hi:   #E7C66B   /* highlights, hovers, focus rings */
--text:      #F5F5F5   /* body text on dark */
--muted:     #A8A8A8   /* secondary labels */
--line:      #333333   /* hairline dividers */
```
Canonical palette is black + gold. (A warm copper `#C77B3B` appears on some
flyers; not adopted, to keep the site consistent.)

**Typography:**
- Display / names / stat numbers: a bold condensed sans (e.g. Oswald / Teko /
  Anton via a self-hosted or Google-font link). Uppercase, tight tracking.
- Body / labels: a clean sans (e.g. Inter / system-ui). Labels are small,
  uppercase, letter-spaced, in `--gold` or `--muted`.
- **Name treatment:** first name in white, last name in gold, stacked; jersey
  number large in a corner.

**Signature components:**
- **Stat tile:** big number (display font) over a tiny uppercase label. Tiles
  sit in a grid inside a titled panel.
- **Highlight panel:** titled section (Offensive / Pitching / Fielding /
  Academic) with a small icon, holding a grid of stat tiles.
- **Info row:** gold uppercase label + white value (position, bats/throws…).
- **Achievement list:** gold-star bullets.
- **Footer band:** tagline ("Compete. Hustle. Glory." / "Built on Passion").

**Logo assets** (to be supplied): Glory script wordmark, Spartan-helmet
"Glory Fastpitch" mark, and/or the G star-shield crest — placed in
`assets/team/`. Roster header uses the primary team logo.

## Pages

| Page | Audience | Purpose |
|------|----------|---------|
| `index.html` | public | Team header/logo, coach contact, responsive grid of approved player cards → link to profile |
| `player.html?id=…` | public | One player: photo, stats + position-relevant metric sections, embedded video, guardian contact, back link |
| `login.html` | parents | Sign up / log in (email/password, email verification) |
| `dashboard.html` | parents | Add/edit their player(s); upload photo; paste video link; enter guardian contact; save; sign out |
| `404.html` | public | Friendly not-found (GitHub Pages serves automatically) |

## File structure

```
tx-glory-adkins-demoss/
├── index.html
├── player.html
├── login.html
├── dashboard.html
├── 404.html
├── css/
│   └── styles.css          # all styling, shared by every page; responsive
├── js/
│   ├── supabaseClient.js   # init Supabase client (URL + anon key)
│   ├── roster.js           # build approved-player grid on index.html
│   ├── player.js           # read ?id=, render profile + conditional sections
│   ├── auth.js             # sign up / log in / sign out
│   └── dashboard.js        # parent CRUD form + photo upload
├── data/
│   └── team.js             # static team info + coach contact constants
└── assets/
    ├── players/            # (photos live in Supabase Storage; local placeholders only)
    ├── team/               # team logo, banner, generated QR code image
    └── favicon
```

## Media & QR

- **Photos:** uploaded by parents to Supabase Storage (small JP/PNG).
- **Videos:** embedded from YouTube/Hudl links — never uploaded.
- **QR code:** generated once, encoding the public roster URL
  (`https://<user>.github.io/<repo>/`); saved to `assets/team/` for flyers/banners.

## Responsive & error handling

- CSS media queries — mobile-first (scouts scan and view on phones).
- Profiles degrade gracefully: missing video/photo/metric groups simply don't render.
- Auth errors and save failures surface inline messages in the dashboard.

## Cost

Supabase free tier comfortably covers a ~10–15 player team; photos are small and
videos are hosted off-platform. GitHub Pages hosting is free.

## Suggested build phases

1. **Backend setup** — Supabase project, `players` table, RLS policies, storage
   bucket + policies, auth settings.
2. **Public read-only site** — `index.html` roster + `player.html` profile
   reading approved players (seed with test data).
3. **Parent auth** — `login.html`, sign up / log in / verification / sign out.
4. **Parent editing** — `dashboard.html` CRUD + photo upload, ownership enforced.
5. **Approval + polish** — admin approval flow, responsive styling, 404, QR code,
   deploy to GitHub Pages.

## Open questions / future

- Optional lightweight in-app admin approval screen (vs. Supabase dashboard) if
  approving from the dashboard becomes tedious.
- Optional "re-review on edit" toggle (reset to pending when a parent edits).
