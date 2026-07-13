# TX Glory Adkins DeMoss — Recruiting Site

Static site (GitHub Pages) + Supabase backend. Scouts scan the team QR → roster → tap a player → profile.

**Live:** https://joshwaldrip1.github.io/tx-glory-adkins-demoss/

## Where the files live (what's safe to delete)

The live website runs from **GitHub's servers**, not from your computer. When we
"deploy," every file — including all icons/images — is copied up to GitHub and
served from there. Your computer can be off and the site stays up.

- **Your Desktop source folders** (e.g. "New folder (2)" with the flyers, logos,
  and screenshots you sent): **safe to delete or move.** The site never reads
  from your Desktop — it uses copies committed inside this project. (Only reason
  to keep them: so we can re-edit an original later.)
- **The `assets/` folder inside this project**
  (`TX-Glory-Softball-Site/assets/…` — favicon, the gold "glory" logo, the
  ribbon/icon artwork, GameChanger emblem, player placeholder): **leave these
  alone.** They're what the site displays. Deleting them locally won't break the
  *live* site until the deletion is committed + pushed — but then it would show
  broken images. Rule of thumb: don't delete anything inside the
  `TX-Glory-Softball-Site` project folder.

## Setup
1. Create a Supabase project. In the SQL editor, run in order:
   `supabase/schema.sql`, `supabase/policies.sql`, `supabase/storage.sql`.
2. Storage → create a **public** bucket named `player-photos` (before running storage.sql).
3. Authentication → Providers → Email: enable + require email confirmation.
4. Put your project URL + anon key in `js/config.js`.
5. Set the real coach contact + logo path in `data/team.js`, and add `assets/team/logo.png`.

## Run locally
`npx serve .` then open http://localhost:3000

## Test
`npm install && npm test`  (pure logic in js/format.js, js/render.js)

## Deploy (GitHub Pages)
1. Push to a GitHub repo.
2. Settings → Pages → Source: deploy from branch `master`, folder `/root`.
3. Live at `https://<user>.github.io/<repo>/`.
4. Generate the QR: `npm run qr -- https://<user>.github.io/<repo>/`, commit the PNG.

## Player profiles
Parents sign up, add/edit their own player, and it publishes immediately
(auto-approve). Every stat/field is optional and hidden when blank.

## Team schedule (admin)
`supabase/games.sql` creates the `games` table (public read) + an `admins`
allowlist (admin-only writes). Admins edit the schedule in the dashboard's
"Team Schedule (Admin)" section. Add an admin: insert their auth user id into
`public.admins`.

## Privacy
`assets/reference/` is git-ignored and must never be committed (contains
minors' flyers). DOB and player contact are optional per-player.
