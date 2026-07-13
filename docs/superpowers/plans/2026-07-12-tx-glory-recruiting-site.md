# TX Glory Adkins-DeMoss Recruiting Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a QR-driven recruiting website where scouts tap a player photo to see that player's profile, and parents self-manage their own child's profile behind a login, with admin approval before profiles go public.

**Architecture:** Plain HTML/CSS/JS (ES modules, no build step) hosted on GitHub Pages, talking directly to a Supabase backend (Auth + Postgres + Storage) via the Supabase JS SDK. Pure rendering/formatting logic lives in unit-tested modules; all network/Supabase access is isolated in a thin `api.js` layer verified manually. Row-Level Security enforces "a parent may edit only their own player," and public reads see only `approved` rows.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS ES modules, Supabase JS v2 (via `esm.sh` CDN), Vitest + jsdom (dev-only test runner), `qrcode` (dev-only, QR generation).

## Global Constraints

- **No frontend build step.** Site is static files served as-is; Supabase SDK loaded from CDN via `import`. Vitest/qrcode are dev-only tooling, never shipped.
- **Team name (verbatim):** `Texas Glory Adkins-DeMoss`. Short form `TX Glory Adkins`.
- **Taglines (verbatim):** `Compete. Hustle. Glory.` and `Built on Passion.`
- **Color tokens:** `--bg:#0E0E0E`, `--panel:#1A1A1A`, `--panel-2:#232323`, `--gold:#C9A24B`, `--gold-hi:#E7C66B`, `--text:#F5F5F5`, `--muted:#A8A8A8`, `--line:#333333`.
- **Privacy (hard rules):** never render or store a player's date of birth or personal phone/email on the public site; contact is guardian-only. Player social handles render only if present in `socials` (opt-in). The `assets/reference/` folder is git-ignored and never deployed.
- **Data visibility:** public (anonymous) reads return only rows where `status='approved'`. New/edited rows are `status='pending'`.
- **Money/keys:** the Supabase anon key is public by design and lives in `js/config.js`. The service-role key is NEVER placed in any committed file or client code.
- **Commits:** frequent, one per completed step where a step changes files.

---

## File Structure

**Frontend (shipped):**
- `index.html` — public roster page.
- `player.html` — public single-player profile (reads `?id=`).
- `login.html` — parent sign-up / log-in.
- `dashboard.html` — parent editing area (auth-gated).
- `404.html` — not-found page.
- `css/styles.css` — all styling + brand tokens.
- `js/config.js` — Supabase URL + anon key constants.
- `js/supabaseClient.js` — initialized Supabase client (singleton).
- `js/format.js` — pure value/format helpers. **Unit-tested.**
- `js/render.js` — pure "player → HTML string" functions. **Unit-tested.**
- `js/api.js` — thin Supabase data-access layer (network). Manually verified.
- `js/roster.js` — index page controller.
- `js/player.js` — profile page controller.
- `js/auth.js` — login page controller.
- `js/dashboard.js` — dashboard controller (form + upload).
- `data/team.js` — team constants (name, taglines, coach contact, logo path).

**Backend (config, committed as SQL for reproducibility):**
- `supabase/schema.sql` — `players` table + `updated_at` trigger.
- `supabase/policies.sql` — RLS enable + policies.
- `supabase/storage.sql` — storage bucket + storage policies.

**Tooling / tests (dev-only):**
- `package.json`, `vitest.config.js`.
- `tests/fixtures/player.js` — representative player objects.
- `tests/format.test.js`, `tests/render.test.js`.
- `scripts/make-qr.mjs` — QR generator.
- `README.md` — setup/deploy instructions.

**Assets:** `assets/team/` (logos, generated QR), `assets/reference/` (git-ignored flyers, already present).

---

## Task 1: Project scaffold + test harness

**Files:**
- Create: `package.json`, `vitest.config.js`, `tests/smoke.test.js`
- Note: `.gitignore` already exists.

**Interfaces:**
- Produces: an `npm test` command running Vitest in jsdom.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tx-glory-recruiting-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "qr": "node scripts/make-qr.mjs"
  },
  "devDependencies": {
    "jsdom": "^24.1.0",
    "qrcode": "^1.5.4",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
```

- [ ] **Step 3: Write a smoke test at `tests/smoke.test.js`**

```js
import { describe, it, expect } from "vitest";

describe("harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Install and run**

Run: `npm install && npm test`
Expected: Vitest reports `1 passed` for `tests/smoke.test.js`.

- [ ] **Step 5: Ignore node_modules, then commit**

Append `node_modules/` to `.gitignore`, then:

```bash
git add package.json vitest.config.js tests/smoke.test.js .gitignore
git commit -m "chore: add vitest test harness"
```

---

## Task 2: Team constants

**Files:**
- Create: `data/team.js`

**Interfaces:**
- Produces: `TEAM` object with `name`, `shortName`, `taglinePrimary`, `taglineSecondary`, `logo`, `coach` (`{name,email,phone}`).

- [ ] **Step 1: Create `data/team.js`**

```js
// Static, non-secret team info shown site-wide.
export const TEAM = {
  name: "Texas Glory Adkins-DeMoss",
  shortName: "TX Glory Adkins",
  taglinePrimary: "Compete. Hustle. Glory.",
  taglineSecondary: "Built on Passion.",
  logo: "assets/team/logo.png", // supplied by user; placeholder path until then
  coach: {
    name: "TBD — set to real coach name before launch",
    email: "coach@example.com",
    phone: "",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add data/team.js
git commit -m "feat: add team constants"
```

> Note: `coach` placeholders are intentional config to be filled by the site owner before launch (Task 16 checklist), not a plan placeholder.

---

## Task 3: Format helpers (pure, TDD)

**Files:**
- Create: `js/format.js`
- Test: `tests/format.test.js`

**Interfaces:**
- Produces:
  - `text(v)` → string; `""` for `null`/`undefined`, else `String(v)`.
  - `hasAny(obj)` → boolean; true if `obj` is an object with ≥1 value that is not `null`, `undefined`, or `""` (empty arrays count as no value).
  - `isPitcher(positions)` → boolean; true if array includes `"P"`.
  - `isCatcher(positions)` → boolean; true if array includes `"C"`.
  - `photoUrl(path, baseUrl)` → string; public storage URL, or `"assets/team/player-placeholder.png"` when `path` is falsy.
  - `youTubeEmbed(url)` → string|null; `https://www.youtube.com/embed/<id>` for youtube/youtu.be URLs, else `null`.

- [ ] **Step 1: Write the failing tests at `tests/format.test.js`**

```js
import { describe, it, expect } from "vitest";
import { text, hasAny, isPitcher, isCatcher, photoUrl, youTubeEmbed } from "../js/format.js";

describe("text", () => {
  it("blanks null/undefined", () => {
    expect(text(null)).toBe("");
    expect(text(undefined)).toBe("");
  });
  it("stringifies values", () => {
    expect(text(0)).toBe("0");
    expect(text(".412")).toBe(".412");
  });
});

describe("hasAny", () => {
  it("false for empty-ish", () => {
    expect(hasAny(null)).toBe(false);
    expect(hasAny({})).toBe(false);
    expect(hasAny({ a: "", b: null, c: [] })).toBe(false);
  });
  it("true when a real value exists", () => {
    expect(hasAny({ a: "", b: "2.9" })).toBe(true);
    expect(hasAny({ a: ["x"] })).toBe(true);
  });
});

describe("position checks", () => {
  it("detects pitcher/catcher", () => {
    expect(isPitcher(["P", "3B"])).toBe(true);
    expect(isPitcher(["SS"])).toBe(false);
    expect(isCatcher(["C"])).toBe(true);
    expect(isCatcher([])).toBe(false);
  });
});

describe("photoUrl", () => {
  it("builds a public storage url", () => {
    expect(photoUrl("maddie/photo.jpg", "https://x.supabase.co")).toBe(
      "https://x.supabase.co/storage/v1/object/public/player-photos/maddie/photo.jpg"
    );
  });
  it("falls back to placeholder", () => {
    expect(photoUrl("", "https://x.supabase.co")).toBe("assets/team/player-placeholder.png");
  });
});

describe("youTubeEmbed", () => {
  it("handles youtu.be and watch urls", () => {
    expect(youTubeEmbed("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(youTubeEmbed("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
  });
  it("returns null for non-youtube", () => {
    expect(youTubeEmbed("https://hudl.com/video/xyz")).toBeNull();
    expect(youTubeEmbed("")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/format.test.js`
Expected: FAIL — cannot resolve `../js/format.js`.

- [ ] **Step 3: Implement `js/format.js`**

```js
export function text(v) {
  return v === null || v === undefined ? "" : String(v);
}

export function hasAny(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

export function isPitcher(positions) {
  return Array.isArray(positions) && positions.includes("P");
}

export function isCatcher(positions) {
  return Array.isArray(positions) && positions.includes("C");
}

export function photoUrl(path, baseUrl) {
  if (!path) return "assets/team/player-placeholder.png";
  return `${baseUrl}/storage/v1/object/public/player-photos/${path}`;
}

export function youTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/format.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add js/format.js tests/format.test.js
git commit -m "feat: add pure format/position helpers with tests"
```

---

## Task 4: Player fixture + render helpers (pure, TDD)

**Files:**
- Create: `tests/fixtures/player.js`, `js/render.js`
- Test: `tests/render.test.js`

**Interfaces:**
- Consumes: `js/format.js` (`text`, `hasAny`, `isPitcher`, `isCatcher`, `photoUrl`, `youTubeEmbed`).
- Player object shape (snake_case, mirrors DB): `{ id, first_name, last_name, jersey_number, grad_year, positions[], bats_throws, height, weight, gpa, school, hometown, stats{}, metrics{fielding{},running{},pitching{},catching{}}, achievements[], academics{honor_roll,awards[],interests[]}, bio{about,softball_iq,coachability,coach_note}, photo_path, video_url, profile_url, socials{}, guardian_name, guardian_email, guardian_phone, status }`.
- Produces:
  - `esc(s)` → HTML-escaped string.
  - `statTile(label, value)` → string (`""` when value blank).
  - `panel(title, innerHtml)` → string (`""` when innerHtml blank).
  - `playerCard(player, baseUrl)` → string (anchor to `player.html?id=<id>`).
  - `profile(player, baseUrl)` → string (full profile; omits empty sections; guardian-only contact; no DOB/player phone).

- [ ] **Step 1: Create `tests/fixtures/player.js`**

```js
export const pitcher = {
  id: "charley-waldrip",
  first_name: "Charley",
  last_name: "Waldrip",
  jersey_number: 15,
  grad_year: 2031,
  positions: ["P", "3B"],
  bats_throws: "L/R",
  height: "5'6\"",
  weight: "140 lbs",
  gpa: 3.8,
  school: "Mildred HS",
  hometown: "Mildred, TX",
  stats: { avg: ".386", obp: ".500", slg: ".404", ops: ".904", hr: "", rbi: "", hits: "44" },
  metrics: {
    fielding: { fielding_pct: ".897", chances: "107", assists: "71", errors: "11" },
    running: { home_to_first: "", stolen_bases: "", sixty_yd: "" },
    pitching: { velo: "55 mph", era: "3.75", k_bb: "", whip: "1.81", k_per_game: "9.75", arsenal: ["FB", "CH"], movement: "" },
    catching: {},
  },
  achievements: ["USSSA All-State", "Silver Slugger"],
  academics: { honor_roll: "All A's", awards: ["Mathematics Award"], interests: ["Doctor", "Lawyer"] },
  bio: { about: "13U competing on 16U showcase team.", softball_iq: "", coachability: "", coach_note: "" },
  photo_path: "charley-waldrip/photo.jpg",
  video_url: "https://youtu.be/abc123",
  profile_url: "https://gc.com/charley",
  socials: {},
  guardian_name: "Josh Waldrip",
  guardian_email: "josh_waldrip@example.com",
  guardian_phone: "903-229-1111",
  status: "approved",
};

// A non-pitcher, non-catcher with minimal data to prove sections collapse.
export const minimalInfielder = {
  id: "jane-doe",
  first_name: "Jane",
  last_name: "Doe",
  jersey_number: 7,
  grad_year: 2030,
  positions: ["SS"],
  bats_throws: "R/R",
  height: "5'4\"",
  weight: "",
  gpa: "",
  school: "",
  hometown: "",
  stats: { avg: ".300" },
  metrics: { fielding: {}, running: {}, pitching: {}, catching: {} },
  achievements: [],
  academics: {},
  bio: {},
  photo_path: "",
  video_url: "",
  profile_url: "",
  socials: {},
  guardian_name: "Parent Doe",
  guardian_email: "parent@example.com",
  guardian_phone: "",
  status: "approved",
};
```

- [ ] **Step 2: Write failing tests at `tests/render.test.js`**

```js
import { describe, it, expect } from "vitest";
import { esc, statTile, panel, playerCard, profile } from "../js/render.js";
import { pitcher, minimalInfielder } from "./fixtures/player.js";

const BASE = "https://x.supabase.co";

describe("esc", () => {
  it("escapes html", () => {
    expect(esc('<b>"&')).toBe("&lt;b&gt;&quot;&amp;");
  });
});

describe("statTile", () => {
  it("renders label + value", () => {
    const html = statTile("AVG", ".386");
    expect(html).toContain(".386");
    expect(html).toContain("AVG");
  });
  it("collapses when blank", () => {
    expect(statTile("HR", "")).toBe("");
  });
});

describe("panel", () => {
  it("collapses when empty inner", () => {
    expect(panel("Pitching", "")).toBe("");
  });
  it("shows title when inner present", () => {
    expect(panel("Pitching", "<div>x</div>")).toContain("Pitching");
  });
});

describe("playerCard", () => {
  it("links to the profile by id and shows name", () => {
    const html = playerCard(pitcher, BASE);
    expect(html).toContain('href="player.html?id=charley-waldrip"');
    expect(html).toContain("Charley");
    expect(html).toContain("Waldrip");
  });
});

describe("profile", () => {
  it("shows pitching panel for a pitcher", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Pitching");
    expect(html).toContain("55 mph");
  });
  it("embeds youtube video", () => {
    expect(profile(pitcher, BASE)).toContain("https://www.youtube.com/embed/abc123");
  });
  it("shows guardian contact but never player DOB/phone fields", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Josh Waldrip");
    expect(html).not.toMatch(/date of birth/i);
  });
  it("omits pitching + catching + academics panels when data absent", () => {
    const html = profile(minimalInfielder, BASE);
    expect(html).not.toContain("Pitching");
    expect(html).not.toContain("Catching");
    expect(html).not.toContain("Academic");
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/render.test.js`
Expected: FAIL — cannot resolve `../js/render.js`.

- [ ] **Step 4: Implement `js/render.js`**

```js
import { text, hasAny, isPitcher, isCatcher, photoUrl, youTubeEmbed } from "./format.js";

export function esc(s) {
  return text(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function statTile(label, value) {
  const v = text(value);
  if (v === "") return "";
  return `<div class="tile"><span class="tile-num">${esc(v)}</span><span class="tile-label">${esc(label)}</span></div>`;
}

export function panel(title, innerHtml) {
  if (!innerHtml) return "";
  return `<section class="panel"><h2 class="panel-title">${esc(title)}</h2><div class="panel-body">${innerHtml}</div></section>`;
}

function tiles(pairs) {
  return pairs.map(([l, v]) => statTile(l, v)).join("");
}

function infoRow(label, value) {
  const v = text(value);
  if (v === "") return "";
  return `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value">${esc(v)}</span></div>`;
}

function listBlock(items) {
  const arr = (items || []).filter((x) => text(x) !== "");
  if (arr.length === 0) return "";
  return `<ul class="stars">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}

export function nameBlock(p) {
  const num = text(p.jersey_number) ? `<span class="jersey">#${esc(p.jersey_number)}</span>` : "";
  return `<div class="name-block">${num}<h1 class="player-name"><span class="fn">${esc(p.first_name)}</span> <span class="ln">${esc(p.last_name)}</span></h1><p class="classyear">Class of ${esc(p.grad_year)}</p></div>`;
}

function offensive(p) {
  const s = p.stats || {};
  return panel("Offensive Highlights", tiles([
    ["AVG", s.avg], ["OBP", s.obp], ["SLG", s.slg], ["OPS", s.ops],
    ["HR", s.hr], ["RBI", s.rbi], ["Hits", s.hits],
    ["Exit Velo", s.exit_velo], ["Bat Speed", s.bat_speed],
  ]));
}

function pitching(p) {
  if (!isPitcher(p.positions)) return "";
  const m = (p.metrics && p.metrics.pitching) || {};
  const t = tiles([
    ["Velocity", m.velo], ["ERA", m.era], ["K/Game", m.k_per_game],
    ["WHIP", m.whip], ["K/BB", m.k_bb],
  ]);
  const arsenal = (m.arsenal && m.arsenal.length) ? `<p class="arsenal">Arsenal: ${m.arsenal.map(esc).join(" · ")}</p>` : "";
  return panel("Pitching Highlights", t + arsenal + infoRow("Movement", m.movement));
}

function catching(p) {
  if (!isCatcher(p.positions)) return "";
  const m = (p.metrics && p.metrics.catching) || {};
  return panel("Catching Highlights", tiles([
    ["Pop Time", m.pop_time], ["Throw Velo", m.throw_velo], ["CS %", m.cs_pct],
  ]) + infoRow("Notes", m.notes));
}

function fielding(p) {
  const m = (p.metrics && p.metrics.fielding) || {};
  const r = (p.metrics && p.metrics.running) || {};
  return panel("Fielding & Athleticism", tiles([
    ["Fielding %", m.fielding_pct], ["Chances", m.chances], ["Assists", m.assists], ["Errors", m.errors],
    ["Home-1B", r.home_to_first], ["Stolen Bases", r.stolen_bases], ["60-yd", r.sixty_yd],
  ]));
}

function academics(p) {
  const a = p.academics || {};
  const inner =
    infoRow("GPA", p.gpa) +
    infoRow("Honor Roll", a.honor_roll) +
    (a.awards && a.awards.length ? `<div class="info-row"><span class="info-label">Awards</span><span class="info-value">${a.awards.map(esc).join(", ")}</span></div>` : "") +
    (a.interests && a.interests.length ? `<div class="info-row"><span class="info-label">Interests</span><span class="info-value">${a.interests.map(esc).join(", ")}</span></div>` : "");
  return panel("Academic Highlights", inner);
}

function achievements(p) {
  return panel("Career Achievements", listBlock(p.achievements));
}

function video(p) {
  const embed = youTubeEmbed(p.video_url);
  if (embed) return `<div class="video"><iframe src="${esc(embed)}" title="Highlights" allowfullscreen loading="lazy"></iframe></div>`;
  if (text(p.video_url)) return `<a class="btn" href="${esc(p.video_url)}" target="_blank" rel="noopener">Watch Highlights</a>`;
  return "";
}

function contact(p) {
  const inner =
    infoRow("Contact", p.guardian_name) +
    infoRow("Email", p.guardian_email) +
    infoRow("Phone", p.guardian_phone);
  return panel("Contact (via guardian)", inner);
}

export function playerCard(p, baseUrl) {
  const img = photoUrl(p.photo_path, baseUrl);
  const pos = (p.positions || []).map(esc).join("/");
  return `<a class="card" href="player.html?id=${encodeURIComponent(p.id)}">
    <img class="card-photo" src="${esc(img)}" alt="${esc(p.first_name)} ${esc(p.last_name)}" loading="lazy">
    <div class="card-body">
      <span class="card-num">#${esc(p.jersey_number)}</span>
      <span class="card-name"><span class="fn">${esc(p.first_name)}</span> <span class="ln">${esc(p.last_name)}</span></span>
      <span class="card-meta">${pos} · Class of ${esc(p.grad_year)}</span>
    </div>
  </a>`;
}

export function profile(p, baseUrl) {
  const img = photoUrl(p.photo_path, baseUrl);
  const infoPanel = panel("Player Information",
    infoRow("Position", (p.positions || []).join(" / ")) +
    infoRow("Bats/Throws", p.bats_throws) +
    infoRow("Height", p.height) +
    infoRow("Weight", p.weight) +
    infoRow("School", p.school) +
    infoRow("Hometown", p.hometown));
  const about = text((p.bio || {}).about) ? panel("About", `<p>${esc(p.bio.about)}</p>`) : "";
  const link = text(p.profile_url) ? `<a class="btn" href="${esc(p.profile_url)}" target="_blank" rel="noopener">Full Stats Profile</a>` : "";
  return `<article class="profile">
    <header class="profile-head">
      <img class="profile-photo" src="${esc(img)}" alt="${esc(p.first_name)} ${esc(p.last_name)}">
      ${nameBlock(p)}
    </header>
    ${infoPanel}
    ${offensive(p)}
    ${pitching(p)}
    ${catching(p)}
    ${fielding(p)}
    ${achievements(p)}
    ${academics(p)}
    ${about}
    ${video(p)}
    ${link}
    ${contact(p)}
    <p class="tagline">Compete. Hustle. Glory. — Built on Passion.</p>
  </article>`;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/render.test.js`
Expected: PASS — all cases green (note: `academics()`/others rely on `hasAny` via `panel` collapsing empty inner; confirm the "omits panels" test passes).

> If the "omits Academic" test fails because `gpa`/awards are all blank yet `panel` still renders, verify `academics()` produces an empty string when every `infoRow` returns `""` — `panel("", "")` returns `""` by the empty-inner guard. `hasAny` import remains available for future use.

- [ ] **Step 6: Commit**

```bash
git add js/render.js tests/render.test.js tests/fixtures/player.js
git commit -m "feat: add pure player render functions with tests"
```

---

## Task 5: Supabase schema

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces: a `players` table matching the render Player shape, with `updated_at` auto-maintained.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- Run in Supabase SQL editor (project → SQL).
create extension if not exists "pgcrypto";

create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  jersey_number int,
  grad_year     int,
  positions     text[] not null default '{}',
  bats_throws   text,
  height        text,
  weight        text,
  gpa           numeric,
  school        text,
  hometown      text,
  stats         jsonb not null default '{}',
  metrics       jsonb not null default '{}',
  achievements  text[] not null default '{}',
  academics     jsonb not null default '{}',
  bio           jsonb not null default '{}',
  photo_path    text,
  video_url     text,
  profile_url   text,
  socials       jsonb not null default '{}',
  guardian_name  text,
  guardian_email text,
  guardian_phone text,
  status        text not null default 'pending' check (status in ('pending','approved')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists players_status_idx on public.players (status);
create index if not exists players_owner_idx on public.players (owner_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Apply and verify**

In the Supabase dashboard SQL editor, paste and Run `supabase/schema.sql`.
Run this verification query:

```sql
select column_name, data_type from information_schema.columns
where table_name = 'players' order by ordinal_position;
```

Expected: rows listing `id, owner_id, first_name, ... status, created_at, updated_at`.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add players table schema"
```

---

## Task 6: Row-Level Security policies

**Files:**
- Create: `supabase/policies.sql`

**Interfaces:**
- Consumes: `public.players` (Task 5).
- Produces: RLS such that anonymous reads see only `approved`; a parent reads/writes only their own rows; inserts are forced `pending`.

- [ ] **Step 1: Write `supabase/policies.sql`**

```sql
alter table public.players enable row level security;

-- Public + owners can read approved rows.
drop policy if exists players_read_approved on public.players;
create policy players_read_approved on public.players
  for select using (status = 'approved');

-- Owners can read their own rows regardless of status (to see pending).
drop policy if exists players_read_own on public.players;
create policy players_read_own on public.players
  for select using (auth.uid() = owner_id);

-- Owners insert only rows they own, forced to pending.
drop policy if exists players_insert_own on public.players;
create policy players_insert_own on public.players
  for insert with check (auth.uid() = owner_id and status = 'pending');

-- Owners update only their own rows; may not self-approve.
drop policy if exists players_update_own on public.players;
create policy players_update_own on public.players
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status = 'pending');

-- Owners delete only their own rows.
drop policy if exists players_delete_own on public.players;
create policy players_delete_own on public.players
  for delete using (auth.uid() = owner_id);
```

- [ ] **Step 2: Apply and verify anonymous visibility**

Run `supabase/policies.sql` in the SQL editor. Then, using the anon key from a REST call or the API docs "anon" role test, confirm:
- A `select * from players` as the anon role returns only `approved` rows.
- Manual check (Task 12 covers the authenticated path): after a parent inserts, the row is `pending` and NOT visible to anon.

Verification query as service role (to see everything for sanity):

```sql
select id, owner_id, status from public.players;
```

Expected: table exists; new inserts default `pending`. Approval is done by the admin (Task 14) via service role/dashboard, which bypasses RLS.

- [ ] **Step 3: Commit**

```bash
git add supabase/policies.sql
git commit -m "feat: add row-level security policies for players"
```

---

## Task 7: Storage bucket + policies

**Files:**
- Create: `supabase/storage.sql`

**Interfaces:**
- Produces: public-read `player-photos` bucket; authenticated users may write only under a path prefixed by a player id they own.

- [ ] **Step 1: Create the bucket**

In Supabase dashboard → Storage → New bucket: name `player-photos`, **Public** enabled.

- [ ] **Step 2: Write `supabase/storage.sql`**

```sql
-- Public read of player photos.
drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects
  for select using (bucket_id = 'player-photos');

-- Authenticated users may upload/update/delete only within a folder
-- named after a player row they own (path: "<player_id>/...").
drop policy if exists photos_owner_write on storage.objects;
create policy photos_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'player-photos'
    and exists (
      select 1 from public.players p
      where p.owner_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );

drop policy if exists photos_owner_modify on storage.objects;
create policy photos_owner_modify on storage.objects
  for update to authenticated
  using (
    bucket_id = 'player-photos'
    and exists (
      select 1 from public.players p
      where p.owner_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );
```

- [ ] **Step 3: Apply and verify**

Run `supabase/storage.sql`. Verify the bucket is public: open `https://<project>.supabase.co/storage/v1/object/public/player-photos/` — expect a JSON/empty listing rather than an auth error.

- [ ] **Step 4: Commit**

```bash
git add supabase/storage.sql
git commit -m "feat: add storage bucket policies for player photos"
```

---

## Task 8: Config + Supabase client + API layer

**Files:**
- Create: `js/config.js`, `js/supabaseClient.js`, `js/api.js`

**Interfaces:**
- Consumes: Supabase project URL + anon key.
- Produces:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (config).
  - `supabase` (initialized client).
  - `api.listApproved()` → `Promise<Player[]>`.
  - `api.getById(id)` → `Promise<Player|null>`.
  - `api.listMine()` → `Promise<Player[]>`.
  - `api.savePlayer(player)` → `Promise<Player>` (insert if no `id`, else update; always sets `status:'pending'`).
  - `api.uploadPhoto(playerId, file)` → `Promise<string>` (returns stored path).
  - `api.signUp(email,password)`, `api.signIn(email,password)`, `api.signOut()`, `api.currentUser()`.

- [ ] **Step 1: Create `js/config.js`**

```js
// Public, non-secret. The anon key is safe in client code; RLS is the guard.
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

- [ ] **Step 2: Create `js/supabaseClient.js`**

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 3: Create `js/api.js`**

```js
import { supabase } from "./supabaseClient.js";

const COLUMNS = "*";

export async function listApproved() {
  const { data, error } = await supabase
    .from("players").select(COLUMNS)
    .eq("status", "approved")
    .order("jersey_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getById(id) {
  const { data, error } = await supabase
    .from("players").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listMine() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("players").select(COLUMNS).eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function savePlayer(player) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const row = { ...player, owner_id: user.id, status: "pending" };
  const { data, error } = await supabase
    .from("players").upsert(row).select().single();
  if (error) throw error;
  return data;
}

export async function uploadPhoto(playerId, file) {
  const path = `${playerId}/photo.jpg`;
  const { error } = await supabase.storage
    .from("player-photos").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export const signUp = (email, password) => supabase.auth.signUp({ email, password });
export const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const currentUser = async () => (await supabase.auth.getUser()).data.user;
```

- [ ] **Step 4: Fill real credentials + verify manually**

Replace the placeholders in `js/config.js` with the real project URL and anon key (Supabase dashboard → Project Settings → API). Then, with a static server running (`npx serve .` or VS Code Live Server), open the browser console on `index.html` and run:

```js
import("./js/api.js").then(async (a) => console.log(await a.listApproved()));
```

Expected: `[]` (no approved players yet) with no network/auth error.

- [ ] **Step 5: Commit**

```bash
git add js/config.js js/supabaseClient.js js/api.js
git commit -m "feat: add supabase config, client, and api layer"
```

> Note: `js/config.js` holds only the public anon key. Confirm the service-role key is nowhere in the repo before committing.

---

## Task 9: Brand CSS

**Files:**
- Create: `css/styles.css`

**Interfaces:**
- Produces: brand tokens + classes used by render.js (`.card`, `.tile`, `.tile-num`, `.tile-label`, `.panel`, `.panel-title`, `.info-row`, `.player-name .fn/.ln`, `.jersey`, `.video`, `.btn`, `.stars`, `.tagline`) and page layout (`.roster-grid`, `.profile`, `.profile-head`, nav).

- [ ] **Step 1: Create `css/styles.css`**

```css
:root {
  --bg:#0E0E0E; --panel:#1A1A1A; --panel-2:#232323;
  --gold:#C9A24B; --gold-hi:#E7C66B; --text:#F5F5F5; --muted:#A8A8A8; --line:#333333;
  --display: "Oswald", system-ui, sans-serif;
  --body: "Inter", system-ui, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin:0; background:var(--bg); color:var(--text);
  font-family:var(--body); line-height:1.4;
}
a { color:var(--gold-hi); }
.wrap { max-width:1100px; margin:0 auto; padding:16px; }

/* Top bar */
.topbar { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--line); }
.topbar img { height:44px; }
.topbar .name { font-family:var(--display); text-transform:uppercase; letter-spacing:1px; color:var(--gold); font-size:1.2rem; }

/* Name treatment */
.player-name { font-family:var(--display); text-transform:uppercase; font-weight:700; line-height:.95; margin:.2em 0; font-size:clamp(2rem,6vw,3.4rem); }
.player-name .fn { color:var(--text); }
.player-name .ln { color:var(--gold); }
.jersey { font-family:var(--display); color:var(--gold); font-size:1.4rem; }
.classyear { color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin:0; }

/* Roster grid */
.roster-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
.card { display:block; background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; text-decoration:none; color:var(--text); transition:border-color .15s; }
.card:hover { border-color:var(--gold); }
.card-photo { width:100%; aspect-ratio:3/4; object-fit:cover; display:block; }
.card-body { padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
.card-num { font-family:var(--display); color:var(--gold); }
.card-name { font-family:var(--display); text-transform:uppercase; font-size:1.15rem; }
.card-name .ln { color:var(--gold); }
.card-meta { color:var(--muted); font-size:.85rem; }

/* Profile */
.profile { max-width:900px; margin:0 auto; }
.profile-head { display:flex; gap:20px; flex-wrap:wrap; align-items:flex-end; padding:16px 0; }
.profile-photo { width:min(320px,80vw); aspect-ratio:3/4; object-fit:cover; border-radius:12px; border:1px solid var(--line); }

/* Panels + tiles */
.panel { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; margin:16px 0; }
.panel-title { font-family:var(--display); text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:0 0 12px; font-size:1.1rem; }
.panel-body { }
.tile, .info-row { }
.panel-body { display:flex; flex-wrap:wrap; gap:14px 22px; }
.tile { display:flex; flex-direction:column; min-width:64px; }
.tile-num { font-family:var(--display); font-size:1.6rem; }
.tile-label { color:var(--muted); text-transform:uppercase; font-size:.7rem; letter-spacing:1px; }
.info-row { display:flex; gap:8px; width:100%; }
.info-label { color:var(--gold); text-transform:uppercase; font-size:.75rem; letter-spacing:1px; min-width:110px; }
.info-value { color:var(--text); }
.stars { list-style:none; padding:0; margin:0; }
.stars li::before { content:"★ "; color:var(--gold); }

/* Video + buttons */
.video { position:relative; width:100%; aspect-ratio:16/9; margin:16px 0; }
.video iframe { position:absolute; inset:0; width:100%; height:100%; border:0; border-radius:12px; }
.btn { display:inline-block; background:var(--gold); color:#111; font-weight:700; text-decoration:none; padding:10px 16px; border-radius:8px; border:0; cursor:pointer; }
.btn:hover { background:var(--gold-hi); }

/* Forms */
.field { display:flex; flex-direction:column; gap:4px; margin:10px 0; }
.field label { color:var(--gold); text-transform:uppercase; font-size:.75rem; letter-spacing:1px; }
.field input, .field textarea, .field select { background:var(--panel-2); border:1px solid var(--line); color:var(--text); padding:10px; border-radius:8px; font:inherit; }
.error { color:#ff8b8b; }
.notice { color:var(--gold-hi); }

.tagline { text-align:center; font-family:var(--display); text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin:24px 0; }

/* Font imports (self-host later for offline; CDN acceptable for now) */
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;600&display=swap");

@media (max-width:520px) {
  .info-label { min-width:90px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: add brand css (black+gold, tiles, panels, forms)"
```

---

## Task 10: Public roster page

**Files:**
- Create: `index.html`, `js/roster.js`

**Interfaces:**
- Consumes: `api.listApproved()`, `render.playerCard`, `TEAM`, `SUPABASE_URL`.
- Produces: a rendered grid of approved players.

- [ ] **Step 1: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Texas Glory Adkins-DeMoss — Roster</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="topbar">
    <img id="logo" alt="Team logo">
    <span class="name" id="team-name"></span>
    <a class="btn" href="login.html" style="margin-left:auto">Parent Login</a>
  </header>
  <main class="wrap">
    <p class="tagline" id="tagline"></p>
    <section class="panel" id="coach"></section>
    <div class="roster-grid" id="grid"><p class="notice">Loading roster…</p></div>
  </main>
  <script type="module" src="js/roster.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/roster.js`**

```js
import { TEAM } from "../data/team.js";
import { listApproved } from "./api.js";
import { playerCard } from "./render.js";
import { SUPABASE_URL } from "./config.js";

document.getElementById("team-name").textContent = TEAM.shortName;
document.getElementById("tagline").textContent = `${TEAM.taglinePrimary} — ${TEAM.taglineSecondary}`;
const logo = document.getElementById("logo");
logo.src = TEAM.logo;
document.getElementById("coach").innerHTML =
  `<h2 class="panel-title">Coach Contact</h2>
   <div class="panel-body"><div class="info-row"><span class="info-label">Coach</span><span class="info-value">${TEAM.coach.name}</span></div>
   <div class="info-row"><span class="info-label">Email</span><span class="info-value">${TEAM.coach.email}</span></div></div>`;

const grid = document.getElementById("grid");
try {
  const players = await listApproved();
  grid.innerHTML = players.length
    ? players.map((p) => playerCard(p, SUPABASE_URL)).join("")
    : `<p class="notice">No players published yet.</p>`;
} catch (e) {
  grid.innerHTML = `<p class="error">Could not load roster: ${e.message}</p>`;
}
```

- [ ] **Step 3: Seed one approved player + verify**

In the SQL editor, insert a test row owned by any existing auth user id (create a test parent account first via Task 12 if needed, or temporarily insert as service role):

```sql
insert into public.players (owner_id, first_name, last_name, jersey_number, grad_year, positions, status, stats)
values ('<some-auth-user-uuid>', 'Test', 'Player', 1, 2030, '{SS}', 'approved', '{"avg":".300"}');
```

Serve locally (`npx serve .`) and open `index.html`.
Expected: one card "Test Player #1", clicking navigates to `player.html?id=…` (404 in browser until Task 11 — that's fine).

- [ ] **Step 4: Commit**

```bash
git add index.html js/roster.js
git commit -m "feat: add public roster page"
```

---

## Task 11: Public profile page

**Files:**
- Create: `player.html`, `js/player.js`

**Interfaces:**
- Consumes: `api.getById(id)`, `render.profile`, `SUPABASE_URL`.
- Produces: a rendered profile for `?id=`.

- [ ] **Step 1: Create `player.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Player — Texas Glory Adkins-DeMoss</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="topbar">
    <a href="index.html" class="btn">← Roster</a>
  </header>
  <main class="wrap" id="main"><p class="notice">Loading…</p></main>
  <script type="module" src="js/player.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/player.js`**

```js
import { getById } from "./api.js";
import { profile } from "./render.js";
import { SUPABASE_URL } from "./config.js";

const id = new URLSearchParams(location.search).get("id");
const main = document.getElementById("main");

if (!id) {
  main.innerHTML = `<p class="error">No player specified.</p>`;
} else {
  try {
    const p = await getById(id);
    if (!p) main.innerHTML = `<p class="error">Player not found.</p>`;
    else {
      document.title = `${p.first_name} ${p.last_name} — Texas Glory Adkins-DeMoss`;
      main.innerHTML = profile(p, SUPABASE_URL);
    }
  } catch (e) {
    main.innerHTML = `<p class="error">Could not load player: ${e.message}</p>`;
  }
}
```

- [ ] **Step 3: Verify**

Serve locally, open `player.html?id=<the test player id>`.
Expected: profile renders with the seeded stats; the pitching/catching/academic panels are absent for the infielder test row; "Contact (via guardian)" panel present.

- [ ] **Step 4: Commit**

```bash
git add player.html js/player.js
git commit -m "feat: add public player profile page"
```

---

## Task 12: Parent auth (login/signup/logout)

**Files:**
- Create: `login.html`, `js/auth.js`

**Interfaces:**
- Consumes: `api.signUp`, `api.signIn`, `api.currentUser`.
- Produces: authenticated session; redirect to `dashboard.html` on success.

- [ ] **Step 1: Enable email auth in Supabase**

Dashboard → Authentication → Providers → Email: enable. Enable "Confirm email".

- [ ] **Step 2: Create `login.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Parent Login — Texas Glory Adkins-DeMoss</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="topbar"><a href="index.html" class="btn">← Roster</a></header>
  <main class="wrap" style="max-width:420px">
    <h1 class="player-name"><span class="fn">Parent</span> <span class="ln">Login</span></h1>
    <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email"></div>
    <div class="field"><label>Password</label><input id="password" type="password" autocomplete="current-password"></div>
    <div style="display:flex; gap:10px; margin:12px 0">
      <button class="btn" id="login">Log In</button>
      <button class="btn" id="signup" style="background:var(--panel-2); color:var(--gold)">Sign Up</button>
    </div>
    <p id="msg" class="notice"></p>
  </main>
  <script type="module" src="js/auth.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `js/auth.js`**

```js
import { signUp, signIn, currentUser } from "./api.js";

const msg = document.getElementById("msg");
const email = document.getElementById("email");
const password = document.getElementById("password");

if (await currentUser()) location.href = "dashboard.html";

document.getElementById("login").addEventListener("click", async () => {
  msg.className = "notice"; msg.textContent = "Signing in…";
  const { error } = await signIn(email.value.trim(), password.value);
  if (error) { msg.className = "error"; msg.textContent = error.message; return; }
  location.href = "dashboard.html";
});

document.getElementById("signup").addEventListener("click", async () => {
  msg.className = "notice"; msg.textContent = "Creating account…";
  const { error } = await signUp(email.value.trim(), password.value);
  if (error) { msg.className = "error"; msg.textContent = error.message; return; }
  msg.textContent = "Check your email to confirm your account, then log in.";
});
```

- [ ] **Step 4: Verify**

Serve locally, open `login.html`. Sign up with a real email; confirm via the email link; log in.
Expected: sign-up shows the "check your email" notice; after confirming, log-in redirects to `dashboard.html` (404 until Task 13 — acceptable), and the session persists.

- [ ] **Step 5: Commit**

```bash
git add login.html js/auth.js
git commit -m "feat: add parent login/signup"
```

---

## Task 13: Parent dashboard (edit + photo upload)

**Files:**
- Create: `dashboard.html`, `js/dashboard.js`

**Interfaces:**
- Consumes: `api.listMine`, `api.savePlayer`, `api.uploadPhoto`, `api.signOut`, `api.currentUser`.
- Produces: create/edit of the parent's own players; each save sets `status:'pending'`.

- [ ] **Step 1: Create `dashboard.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Players — Texas Glory Adkins-DeMoss</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="topbar">
    <a href="index.html" class="btn">← Roster</a>
    <button class="btn" id="logout" style="margin-left:auto; background:var(--panel-2); color:var(--gold)">Log Out</button>
  </header>
  <main class="wrap">
    <h1 class="player-name"><span class="fn">My</span> <span class="ln">Players</span></h1>
    <p class="notice">New or edited profiles are reviewed by the team before they appear to scouts.</p>
    <div id="mine"></div>
    <section class="panel">
      <h2 class="panel-title">Add / Edit Player</h2>
      <form id="form" class="panel-body" style="flex-direction:column">
        <input type="hidden" id="id">
        <div class="field"><label>First name</label><input id="first_name" required></div>
        <div class="field"><label>Last name</label><input id="last_name" required></div>
        <div class="field"><label>Jersey #</label><input id="jersey_number" type="number"></div>
        <div class="field"><label>Grad year</label><input id="grad_year" type="number"></div>
        <div class="field"><label>Positions (comma separated, e.g. P,3B)</label><input id="positions"></div>
        <div class="field"><label>Bats/Throws</label><input id="bats_throws" placeholder="R/R"></div>
        <div class="field"><label>Height</label><input id="height"></div>
        <div class="field"><label>Batting AVG</label><input id="avg"></div>
        <div class="field"><label>OBP</label><input id="obp"></div>
        <div class="field"><label>ERA (pitchers)</label><input id="era"></div>
        <div class="field"><label>Pitch velo (pitchers)</label><input id="velo"></div>
        <div class="field"><label>Highlight video URL (YouTube/Hudl)</label><input id="video_url"></div>
        <div class="field"><label>Guardian name</label><input id="guardian_name" required></div>
        <div class="field"><label>Guardian email</label><input id="guardian_email" type="email" required></div>
        <div class="field"><label>Guardian phone</label><input id="guardian_phone"></div>
        <div class="field"><label>Player photo</label><input id="photo" type="file" accept="image/*"></div>
        <button class="btn" type="submit">Save (submit for review)</button>
        <p id="msg"></p>
      </form>
    </section>
  </main>
  <script type="module" src="js/dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/dashboard.js`**

```js
import { listMine, savePlayer, uploadPhoto, signOut, currentUser } from "./api.js";

if (!(await currentUser())) location.href = "login.html";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

document.getElementById("logout").addEventListener("click", async () => {
  await signOut(); location.href = "index.html";
});

async function refresh() {
  const players = await listMine();
  $("mine").innerHTML = players.length
    ? players.map((p) =>
        `<div class="info-row"><span class="info-value">#${p.jersey_number ?? ""} ${p.first_name} ${p.last_name}
         — <em>${p.status}</em></span>
         <button class="btn" data-edit="${p.id}" style="margin-left:auto">Edit</button></div>`).join("")
    : `<p class="notice">No players yet — add one below.</p>`;
  document.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => loadInto(players.find((p) => p.id === b.dataset.edit))));
}

function loadInto(p) {
  $("id").value = p.id;
  for (const k of ["first_name","last_name","jersey_number","grad_year","bats_throws","height","video_url","guardian_name","guardian_email","guardian_phone"]) {
    $(k).value = p[k] ?? "";
  }
  $("positions").value = (p.positions ?? []).join(",");
  $("avg").value = p.stats?.avg ?? "";
  $("obp").value = p.stats?.obp ?? "";
  $("era").value = p.metrics?.pitching?.era ?? "";
  $("velo").value = p.metrics?.pitching?.velo ?? "";
  msg.textContent = `Editing ${p.first_name} ${p.last_name}`;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "notice"; msg.textContent = "Saving…";
  try {
    const positions = $("positions").value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const player = {
      ...( $("id").value ? { id: $("id").value } : {} ),
      first_name: $("first_name").value.trim(),
      last_name: $("last_name").value.trim(),
      jersey_number: $("jersey_number").value ? Number($("jersey_number").value) : null,
      grad_year: $("grad_year").value ? Number($("grad_year").value) : null,
      positions,
      bats_throws: $("bats_throws").value.trim(),
      height: $("height").value.trim(),
      stats: { avg: $("avg").value.trim(), obp: $("obp").value.trim() },
      metrics: { pitching: { era: $("era").value.trim(), velo: $("velo").value.trim() } },
      video_url: $("video_url").value.trim(),
      guardian_name: $("guardian_name").value.trim(),
      guardian_email: $("guardian_email").value.trim(),
      guardian_phone: $("guardian_phone").value.trim(),
    };
    const saved = await savePlayer(player);
    const file = $("photo").files[0];
    if (file) {
      const path = await uploadPhoto(saved.id, file);
      await savePlayer({ ...saved, photo_path: path });
    }
    msg.textContent = "Saved. Submitted for review.";
    $("form").reset(); $("id").value = "";
    await refresh();
  } catch (err) {
    msg.className = "error"; msg.textContent = err.message;
  }
});

await refresh();
```

- [ ] **Step 3: Verify ownership + pending flow**

Logged in as the test parent: add a player with a photo. Confirm:
- The new player appears under "My Players" as `pending`.
- It does NOT appear on the public `index.html` (still pending).
- Open a second browser/account; confirm that account cannot see or edit the first account's player (list is empty for them).
- Photo uploaded: check Storage → `player-photos/<player-id>/photo.jpg` exists.

Expected: all four hold. If a cross-account edit succeeds, RLS (Task 6) is misconfigured — re-run `policies.sql`.

- [ ] **Step 4: Commit**

```bash
git add dashboard.html js/dashboard.js
git commit -m "feat: add parent dashboard with edit and photo upload"
```

---

## Task 14: Approval flow + 404

**Files:**
- Create: `404.html`
- Modify: `README.md` (approval instructions — created in Task 16; add section there)

**Interfaces:**
- Produces: documented admin approval; a not-found page.

- [ ] **Step 1: Verify admin approval works**

As admin, in Supabase dashboard → Table editor → `players`, change a pending row's `status` to `approved`. Reload `index.html`.
Expected: the player now appears on the public roster.

- [ ] **Step 2: Create `404.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not Found — Texas Glory Adkins-DeMoss</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main class="wrap" style="text-align:center">
    <h1 class="player-name"><span class="fn">Page</span> <span class="ln">Not Found</span></h1>
    <p><a class="btn" href="index.html">Back to Roster</a></p>
    <p class="tagline">Compete. Hustle. Glory. — Built on Passion.</p>
  </main>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add 404.html
git commit -m "feat: add 404 page"
```

---

## Task 15: QR code generation

**Files:**
- Create: `scripts/make-qr.mjs`

**Interfaces:**
- Consumes: `qrcode` (dev dep, Task 1).
- Produces: `assets/team/qr-roster.png` from the deployed roster URL.

- [ ] **Step 1: Create `scripts/make-qr.mjs`**

```js
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";

const url = process.argv[2];
if (!url) { console.error("Usage: npm run qr -- <roster-url>"); process.exit(1); }

await mkdir("assets/team", { recursive: true });
await QRCode.toFile("assets/team/qr-roster.png", url, {
  width: 800, margin: 2,
  color: { dark: "#0E0E0E", light: "#FFFFFF" },
});
console.log("Wrote assets/team/qr-roster.png →", url);
```

- [ ] **Step 2: Verify (after deploy URL is known — see Task 16)**

Run: `npm run qr -- https://<user>.github.io/tx-glory-adkins-demoss/`
Expected: `assets/team/qr-roster.png` created; scanning it opens the roster.

- [ ] **Step 3: Commit**

```bash
git add scripts/make-qr.mjs assets/team/qr-roster.png
git commit -m "feat: add QR generator and roster QR image"
```

---

## Task 16: README + GitHub Pages deploy

**Files:**
- Create: `README.md`, `assets/team/player-placeholder.png` (any neutral 3:4 placeholder image)

**Interfaces:**
- Produces: setup/deploy docs; a live site.

- [ ] **Step 1: Add a placeholder image**

Place a simple neutral 3:4 image at `assets/team/player-placeholder.png` (used when a player has no photo). A solid dark card with the team gold "G" is fine.

- [ ] **Step 2: Create `README.md`**

````markdown
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
````

- [ ] **Step 3: Verify deploy end-to-end**

Push, enable Pages, open the live URL.
Expected: roster loads over HTTPS; an approved player's profile renders; parent login + a test submission works against the live site (Supabase is the same backend).

- [ ] **Step 4: Commit**

```bash
git add README.md assets/team/player-placeholder.png
git commit -m "docs: add README and deploy instructions"
```

---

## Self-Review

**Spec coverage:**
- Purpose / QR scout flow → Tasks 10, 11, 15. ✅
- Parent self-signup + edit own only → Tasks 12, 13 + RLS Task 6. ✅
- Admin approval gate → Tasks 6 (insert forced pending), 14. ✅
- Supabase auth/DB/storage → Tasks 5, 6, 7, 8, 12, 13. ✅
- Position-aware stat groups → Task 4 (`pitching`/`catching` guarded by `isPitcher`/`isCatcher`; panels collapse when empty). ✅
- Brand tokens / name treatment / tiles → Task 9 + render.js Task 4. ✅
- Full public names (family-approved) → render.js `nameBlock`/`playerCard` show `first_name`+`last_name`. ✅
- Privacy: no DOB/player phone; guardian-only; opt-in socials; reference gitignored → render.js `profile` (no DOB field), schema omits DOB, `.gitignore`, README. ✅
- Videos embedded not uploaded → `youTubeEmbed` + link fallback (Task 4); no video storage. ✅
- 404 + responsive → Tasks 14, 9. ✅
- Cost/free tier → no server; static + Supabase free tier (README). ✅

**Placeholder scan:** `data/team.js` coach fields and `js/config.js` credentials are intentional owner-config (flagged in README Task 16 + notes), not unfinished plan steps. No "TBD/implement later" in code logic.

**Type consistency:** Player shape (snake_case) is identical across `tests/fixtures/player.js`, `render.js`, `api.js`, `schema.sql`, and `dashboard.js`. Function names consistent: `listApproved/getById/listMine/savePlayer/uploadPhoto/signUp/signIn/signOut/currentUser`; render `esc/statTile/panel/playerCard/profile/nameBlock`; format `text/hasAny/isPitcher/isCatcher/photoUrl/youTubeEmbed`. `photoUrl` takes `(path, baseUrl)` everywhere it's called (roster.js, player.js pass `SUPABASE_URL`). ✅

**Note on socials:** `socials` is stored and privacy-scoped but the dashboard form (Task 13) intentionally omits a socials input to keep the first version lean (YAGNI); rendering support can be added later without schema change. Recorded as a future item.
