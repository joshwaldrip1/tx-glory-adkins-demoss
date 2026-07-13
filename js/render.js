import { text, photoUrl, youTubeEmbed } from "./format.js";
import { STAT_GROUPS, slugStat } from "../data/stat-catalog.js";

// Preferred display order for the stat cards (flyer order). Any group NOT listed
// here still renders — it's appended after these — so this is a sort hint, not an
// allow-list, and adding a group to the catalog can never silently drop its card.
const CARD_ORDER = ["batting", "fielding", "pitching", "catching", "innings"];

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

// Gold "ribbon" section header, like the flyer.
function ribbon(title) {
  return `<div class="ribbon"><span>${esc(title)}</span></div>`;
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
// Iterates the catalog itself (single source of truth), sorted by CARD_ORDER.
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
      return `<section class="stat-card"><h3 class="card-title">${esc(g.title)}</h3><div class="card-tiles">${tiles}</div></section>`;
    })
    .join("");
}

function playerInfo(p) {
  const bt = text(p.bats_throws).split("/");
  const bats = text(bt[0]).trim();
  const throws = text(bt[1]).trim();
  const tiles =
    statTile("Height", p.height) +
    statTile("Weight", p.weight) +
    statTile("Bats", bats) +
    statTile("Throws", throws);
  const rows = infoRow("Hometown", p.hometown) + infoRow("School", p.school);
  if (!tiles && !rows) return "";
  return `<section class="panel info-panel">
    <h2 class="panel-title">Player Information</h2>
    <div class="card-tiles">${tiles}</div>
    ${rows}
  </section>`;
}

function academics(p) {
  const a = p.academics || {};
  const inner =
    infoRow("GPA", p.gpa) +
    infoRow("Honor Roll", a.honor_roll) +
    listLine("Academic Awards", a.awards) +
    listLine("Athletic Awards", p.achievements);
  if (!inner) return "";
  return `<section class="panel"><h2 class="panel-title">Academic &amp; Awards</h2>${inner}</section>`;
}

function interests(p) {
  const inner = listLine("Academic Interests", (p.academics || {}).interests);
  if (!inner) return "";
  return `<section class="panel"><h2 class="panel-title">Interests</h2>${inner}</section>`;
}

function video(p) {
  const embed = youTubeEmbed(p.video_url);
  if (embed) return `<div class="video"><iframe src="${esc(embed)}" title="Highlights" allowfullscreen loading="lazy"></iframe></div>`;
  const safe = safeUrl(p.video_url);
  if (safe) return `<a class="btn" href="${esc(safe)}" target="_blank" rel="noopener">Watch Highlights</a>`;
  return "";
}

function contactRow(p) {
  const inner =
    infoRow("Contact", p.guardian_name) +
    infoRow("Email", p.guardian_email) +
    infoRow("Phone", p.guardian_phone);
  if (!inner) return "";
  return `${ribbon("Contact Information")}<section class="panel contact-panel">${inner}</section>`;
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
  const wordmark = `<span class="hero-wordmark">Glory</span>`;
  const about = text((p.bio || {}).about) ? `<p class="hero-sub">${esc(p.bio.about)}</p>` : "";
  const safeProfile = safeUrl(p.profile_url);
  const link = safeProfile ? `<a class="btn" href="${esc(safeProfile)}" target="_blank" rel="noopener">Full Stats Profile</a>` : "";
  const cards = statCards(p);
  const statsSection = cards ? `${ribbon("Player Stats")}<div class="stat-cards">${cards}</div>` : "";

  return `<article class="profile">
    <header class="hero">
      <div class="hero-text">
        <h1 class="player-name"><span class="fn">${esc(p.first_name)}</span><span class="ln">${esc(p.last_name)}</span></h1>
        <div class="pos-row">${posPill}${cls}</div>
        ${about}
      </div>
      <div class="hero-brand">${wordmark}${jersey}</div>
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
