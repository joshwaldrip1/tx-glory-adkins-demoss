import { esc } from "./render.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-07-12" -> "Jul 12, 2026" (deterministic, no timezone math).
export function formatGameDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || "").trim());
  if (!m) return String(dateStr || "");
  return `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}`;
}

// Parse a 12-hour clock time ("1:50 PM") into minutes since midnight for sorting.
// Blank/unparseable times sort first within their day.
export function timeMinutes(t) {
  const m = /(\d{1,2}):(\d{2})\s*([ap])\.?m\.?/i.exec(String(t || "").trim());
  if (!m) return -1;
  let h = +m[1];
  const pm = /p/i.test(m[3]);
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h * 60 + +m[2];
}

// Split games into upcoming (>= today, soonest first) and past (< today, most recent first).
// Dates compare as ISO strings; times within a day compare by minutes-of-day.
export function splitGames(games, today) {
  const list = (games || []).filter((g) => g && g.game_date);
  const upcoming = list
    .filter((g) => g.game_date >= today)
    .sort((a, b) => a.game_date.localeCompare(b.game_date) || timeMinutes(a.game_time) - timeMinutes(b.game_time));
  const past = list
    .filter((g) => g.game_date < today)
    .sort((a, b) => b.game_date.localeCompare(a.game_date) || timeMinutes(b.game_time) - timeMinutes(a.game_time));
  return { upcoming, past };
}

export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// One game row. Result badge shown only for past/played games.
export function gameCard(g) {
  const time = g.game_time ? ` · <span class="g-time">${esc(g.game_time)}</span>` : "";
  const titleTxt = [g.event, g.opponent].filter((v) => v).join(" — ");
  const title = titleTxt ? `<span class="g-title">${esc(titleTxt)}</span>` : "";
  const loc = g.location ? `<span class="g-loc">${esc(g.location)}</span>` : "";
  const res = g.result ? `<span class="g-result">${esc(g.result)}</span>` : "";
  return `<div class="game">
    <div class="g-when"><span class="g-date">${esc(formatGameDate(g.game_date))}</span>${time}</div>
    <div class="g-main">${title}${loc}</div>
    ${res}
  </div>`;
}

// Full schedule body (two sections). Returns "" placeholders when a section is empty.
export function scheduleHtml(games, today, ribbon) {
  const { upcoming, past } = splitGames(games, today);
  const section = (title, items) =>
    `${ribbon(title)}<div class="game-list">${items.length ? items.map(gameCard).join("") : `<p class="notice">Nothing here yet.</p>`}</div>`;
  return section("Upcoming", upcoming) + section("Results", past);
}
