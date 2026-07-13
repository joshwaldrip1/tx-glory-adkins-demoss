import { text, photoUrl, youTubeEmbed } from "./format.js";
import { STAT_GROUPS, slugStat } from "../data/stat-catalog.js";

// Preferred display order for the stat cards (flyer order). Any group NOT listed
// here still renders — it's appended after these — so this is a sort hint, not an
// allow-list, and adding a group to the catalog can never silently drop its card.
const CARD_ORDER = ["batting", "fielding", "pitching", "catching", "innings"];

// Team flyer artwork (transparent PNGs). Section headers + stat-card titles + icons.
const ART = "assets/team/art/";
const RIBBON = {
  playerinfo: "ribbon-playerinfo", playerstats: "ribbon-playerstats",
  academics: "ribbon-academics", interests: "ribbon-interests", contact: "ribbon-contact",
};
const CARD_TITLE = {
  batting: "title-batting", fielding: "title-fielding", pitching: "title-pitching",
  catching: "title-catching", innings: "title-innings",
};

export function esc(s) {
  return text(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeUrl(url) {
  const u = text(url).trim();
  return /^https?:\/\//i.test(u) ? u : "";
}

// Gold ribbon section header — uses the flyer artwork, falling back to styled text.
function ribbon(key, textFallback) {
  const f = RIBBON[key];
  if (f) return `<div class="ribbon"><img src="${ART}${f}.png" alt="${esc(textFallback)}"></div>`;
  return `<div class="ribbon"><span>${esc(textFallback)}</span></div>`;
}

function cardTitle(key, textFallback) {
  const f = CARD_TITLE[key];
  if (f) return `<img class="card-title-img" src="${ART}${f}.png" alt="${esc(textFallback)}">`;
  return `<h3 class="card-title">${esc(textFallback)}</h3>`;
}

export function statTile(label, value, title) {
  const v = text(value);
  if (v === "") return "";
  const t = title ? ` title="${esc(title)}"` : "";
  return `<div class="tile"${t}><span class="tile-num">${esc(v)}</span><span class="tile-label">${esc(label)}</span></div>`;
}

export function panel(title, innerHtml) {
  if (!innerHtml) return "";
  return `<section class="panel"><h2 class="panel-title">${esc(title)}</h2><div class="panel-body">${innerHtml}</div></section>`;
}

function infoRow(label, value) {
  const v = text(value);
  if (v === "") return "";
  return `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value">${esc(v)}</span></div>`;
}

function listLine(label, items) {
  const arr = (items || []).filter((x) => text(x) !== "");
  if (arr.length === 0) return "";
  return `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value">${arr.map(esc).join(", ")}</span></div>`;
}

// One stat card per group (only if it has data), in flyer order.
function statCards(p) {
  const stats = p.stats || {};
  const rank = (k) => { const i = CARD_ORDER.indexOf(k); return i < 0 ? 999 : i; };
  return [...STAT_GROUPS]
    .sort((a, b) => rank(a.key) - rank(b.key))
    .map((g) => {
      const vals = stats[g.key] || {};
      const tiles = g.stats
        .map((s) => statTile(s.label, vals[slugStat(s.label)], s.name))
        .join("");
      if (!tiles) return "";
      return `<section class="stat-card">${cardTitle(g.key, g.title)}<div class="card-tiles">${tiles}</div></section>`;
    })
    .join("");
}

function playerInfo(p) {
  const bt = text(p.bats_throws).split("/");
  const tiles =
    statTile("Height", p.height) +
    statTile("Weight", p.weight) +
    statTile("Bats", text(bt[0]).trim()) +
    statTile("Throws", text(bt[1]).trim()) +
    statTile("GPA", p.gpa) +
    statTile("Grad Year", p.grad_year);
  const b = p.bio || {};
  const rows =
    infoRow("Positions", (p.positions || []).join(" / ")) +
    infoRow("Commitment", b.commitment) +
    infoRow("Bat / Glove / Throws", b.bat_glove) +
    infoRow("Hometown", p.hometown) +
    infoRow("School", p.school) +
    infoRow("Travel Org", b.travel_org) +
    infoRow("HS / Travel Coach", b.hs_coach) +
    infoRow("NCSA ID", b.ncsa_id) +
    infoRow("SportsRecruits ID", b.sportsrecruits_id) +
    infoRow("GameChanger ID", b.gamechanger_id);
  if (!tiles && !rows) return "";
  return `<section class="panel info-panel">
    <div class="info-top">
      ${ribbon("playerinfo", "Player Information")}
      <div class="card-tiles">${tiles}</div>
    </div>
    ${rows ? `<div class="info-bottom">${rows}</div>` : ""}
  </section>`;
}

function academics(p) {
  const a = p.academics || {};
  const inner =
    infoRow("Honor Roll", a.honor_roll) +
    listLine("Academic Awards", a.awards) +
    listLine("Athletic Awards", p.achievements);
  if (!inner) return "";
  return `<section class="panel">${ribbon("academics", "Academic & Awards")}${inner}</section>`;
}

function interests(p) {
  const inner = listLine("Academic Interests", (p.academics || {}).interests);
  if (!inner) return "";
  return `<section class="panel">${ribbon("interests", "Interests")}${inner}</section>`;
}

function video(p) {
  const embed = youTubeEmbed(p.video_url);
  if (embed) return `<div class="video"><iframe src="${esc(embed)}" title="Highlights" allowfullscreen loading="lazy"></iframe></div>`;
  const safe = safeUrl(p.video_url);
  if (safe) return `<a class="btn" href="${esc(safe)}" target="_blank" rel="noopener">Watch Highlights</a>`;
  return "";
}

function contactItem(iconKey, lines) {
  const vals = (lines || []).filter((x) => text(x) !== "");
  if (vals.length === 0) return "";
  return `<div class="contact-item"><img class="contact-icon" src="${ART}icon-${iconKey}.png" alt=""><span>${vals.map(esc).join("<br>")}</span></div>`;
}

function contactRow(p) {
  const inner =
    contactItem("email", [p.guardian_name, p.guardian_email]) +
    contactItem("phone", [p.guardian_phone]) +
    contactItem("location", [p.hometown]);
  if (!inner) return "";
  return `${ribbon("contact", "Contact Information")}<section class="panel contact-panel">${inner}</section>`;
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

export function profile(p, baseUrl, teamLogo) {
  const img = photoUrl(p.photo_path, baseUrl);
  const positions = (p.positions || []).map(esc).join(" · ");
  const posPill = positions ? `<span class="pos-pill">${positions}</span>` : "";
  const cls = text(p.grad_year) ? `<span class="pos-meta">Class of ${esc(p.grad_year)}</span>` : "";
  const jersey = text(p.jersey_number) ? `<span class="jersey">#${esc(p.jersey_number)}</span>` : "";
  const logo = teamLogo ? `<img class="hero-logo" src="${esc(teamLogo)}" alt="Glory">` : "";
  const about = text((p.bio || {}).about) ? `<p class="hero-sub">${esc(p.bio.about)}</p>` : "";
  const safeProfile = safeUrl(p.profile_url);
  const link = safeProfile ? `<a class="btn" href="${esc(safeProfile)}" target="_blank" rel="noopener">Full Stats Profile</a>` : "";
  const cards = statCards(p);
  const statsSection = cards ? `${ribbon("playerstats", "Player Stats")}<div class="stat-cards">${cards}</div>` : "";

  return `<article class="profile">
    <header class="hero">
      <div class="hero-text">
        <h1 class="player-name"><span class="fn">${esc(p.first_name)}</span><span class="ln">${esc(p.last_name)}</span></h1>
        <div class="pos-row">${posPill}${cls}</div>
        ${about}
      </div>
      <div class="hero-brand">${logo}${jersey}</div>
    </header>

    <div class="info-photo">
      ${playerInfo(p)}
      <div class="photo-box"><img class="profile-photo" src="${esc(img)}" alt="${esc(p.first_name)} ${esc(p.last_name)}"></div>
    </div>

    ${statsSection}

    <div class="two-col">${academics(p)}${interests(p)}</div>

    ${contactRow(p)}

    ${video(p)}
    ${link ? `<div class="cta-row">${link}</div>` : ""}

    <p class="tagline">Faith. Family. Hard Work. Team First. — <span class="gold">Built on Passion.</span></p>
  </article>`;
}
