# Texas Glory Adkins-DeMoss — Recruiting Site

Static site (GitHub Pages) + Supabase backend. Scouts scan the team QR → roster → tap a player → profile.

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

## Approving profiles (admin)
Supabase → Table editor → `players` → set a row's `status` to `approved`.
Only approved players are visible to the public.

## Privacy
No player DOB or personal phone/email is published; contact routes to a guardian.
`assets/reference/` is git-ignored and must never be committed.
