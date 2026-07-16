import { TEAM } from "../data/team.js";
import { listApproved, listGames } from "./api.js";
import { playerCard, esc } from "./render.js";
import { SUPABASE_URL } from "./config.js";
import { splitGames, todayISO, formatGameDate } from "./schedule.js";

document.getElementById("team-name").textContent = TEAM.shortName;
document.getElementById("tagline").textContent = `${TEAM.taglinePrimary} — ${TEAM.taglineSecondary}`;
const logo = document.getElementById("logo");
logo.src = TEAM.logo;

// "In the News" banner(s)
const news = (TEAM.news || []).filter((n) => n && n.url && /^https?:\/\//i.test(n.url));
document.getElementById("news").innerHTML = news.map((n) =>
  `<a class="news-banner" href="${esc(n.url)}" target="_blank" rel="noopener">
     <span class="news-badge">📺 In the News</span>
     <span class="news-text">${esc(n.source)} — ${esc(n.title)}</span>
   </a>`).join("");

// Brand glyphs (single-path SVGs, viewBox 0 0 24 24). Only platforms present in
// TEAM.socials render; a globe is the fallback for anything without a glyph.
const SOCIAL = {
  facebook: { label: "Facebook", path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" },
  instagram: { label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" },
  x: { label: "X", path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
  tiktok: { label: "TikTok", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  youtube: { label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" },
  gamechanger: { label: "GameChanger", img: "assets/team/gamechanger.png" },
  website: { label: "Website", path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.82 7.82 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26Zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8 8 0 0 1 5.07 16Zm2.95-8H5.07a8 8 0 0 1 4.33-3.56C8.8 5.55 8.34 6.75 8.02 8ZM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82A13.7 13.7 0 0 1 12 19.96ZM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4Zm.28 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8 8 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.82 7.82 0 0 1 0 4h-3.38Z" },
};

function socialIcon(s) {
  const g = SOCIAL[s.platform] || SOCIAL.website;
  const inner = g.img
    ? `<img class="social-img" src="${esc(g.img)}" alt="">`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${g.path}"/></svg>`;
  return `<a class="social-link" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(g.label)}" title="${esc(g.label)}">${inner}</a>`;
}

const socials = (TEAM.socials || []).filter((s) => s && s.url && /^https?:\/\//i.test(s.url));
const socialsHtml = socials.length
  ? `<div class="info-row"><span class="info-label">Follow</span><span class="social-icons">${socials.map(socialIcon).join("")}</span></div>`
  : "";

document.getElementById("coach").innerHTML =
  `<h2 class="panel-title">Coach Contact</h2>
   <div class="panel-body"><div class="info-row"><span class="info-label">Coach</span><span class="info-value">${esc(TEAM.coach.name)}</span></div>
   <div class="info-row"><span class="info-label">Email</span><span class="info-value"><a class="mail-link" href="mailto:${esc(TEAM.coach.email)}">${esc(TEAM.coach.email)}</a><a class="mail-icon" href="mailto:${esc(TEAM.coach.email)}" aria-label="Email the team" title="Send an email"><img src="assets/team/art/icon-email.png" alt=""></a></span></div>
   ${socialsHtml}</div>`;

const grid = document.getElementById("grid");
try {
  const players = await listApproved();
  grid.innerHTML = players.length
    ? players.map((p) => playerCard(p, SUPABASE_URL)).join("")
    : `<p class="notice">No players published yet.</p>`;
} catch (e) {
  console.error(e);
  grid.innerHTML = `<p class="error">Could not load the roster right now. Please try again later.</p>`;
}

// Upcoming games in the sidebar (earliest → latest); hidden when there are none.
try {
  const { upcoming } = splitGames(await listGames(), todayISO());
  if (upcoming.length) {
    document.getElementById("side-upcoming").innerHTML =
      `<h3 class="side-title">Upcoming</h3>` +
      upcoming.slice(0, 6).map((g) => {
        const opp = [g.event, g.opponent].filter(Boolean).join(" — ") || "Game";
        const time = g.game_time ? ` · ${esc(g.game_time)}` : "";
        return `<a class="side-game" href="schedule.html">
          <span class="sg-date">${esc(formatGameDate(g.game_date))}${time}</span>
          <span class="sg-opp">${esc(opp)}</span>
        </a>`;
      }).join("");
  }
} catch (e) {
  console.error(e);
}
