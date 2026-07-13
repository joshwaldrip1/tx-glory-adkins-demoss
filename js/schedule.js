import { esc } from "./render.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-07-12" -> "Jul 12, 2026" (deterministic, no timezone math).
export function formatGameDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || "").trim());
  if (!m) return String(dateStr || "");
  return `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}`;
}

// Split games into upcoming (>= today, soonest first) and past (< today, most recent first).
// `today` is a "YYYY-MM-DD" string; ISO date strings compare correctly lexicographically.
export function splitGames(games, today) {
  const list = (games || []).filter((g) => g && g.game_date);
  const upcoming = list
    .filter((g) => g.game_date >= today)
    .sort((a, b) => (a.game_date + (a.game_time || "")).localeCompare(b.game_date + (b.game_time || "")));
  const past = list
    .filter((g) => g.game_date < today)
    .sort((a, b) => b.game_date.localeCompare(a.game_date));
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
