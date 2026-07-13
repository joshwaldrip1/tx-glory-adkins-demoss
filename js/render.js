import { text, photoUrl, youTubeEmbed } from "./format.js";
import { STAT_GROUPS, slugStat } from "../data/stat-catalog.js";

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

// Build one panel per stat group from the catalog. A tile renders only when the
// parent filled that stat; a whole group's panel collapses when it has no values.
export function statSections(p) {
  const stats = p.stats || {};
  return STAT_GROUPS.map((g) => {
    const vals = stats[g.key] || {};
    const inner = g.stats
      .map((s) => statTile(s.label, vals[slugStat(s.label)], s.name))
      .join("");
    return panel(g.title, inner);
  }).join("");
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
  const safe = safeUrl(p.video_url);
  if (safe) return `<a class="btn" href="${esc(safe)}" target="_blank" rel="noopener">Watch Highlights</a>`;
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
  const safeProfile = safeUrl(p.profile_url);
  const link = safeProfile ? `<a class="btn" href="${esc(safeProfile)}" target="_blank" rel="noopener">Full Stats Profile</a>` : "";
  return `<article class="profile">
    <header class="profile-head">
      <img class="profile-photo" src="${esc(img)}" alt="${esc(p.first_name)} ${esc(p.last_name)}">
      ${nameBlock(p)}
    </header>
    ${infoPanel}
    ${statSections(p)}
    ${achievements(p)}
    ${academics(p)}
    ${about}
    ${video(p)}
    ${link}
    ${contact(p)}
    <p class="tagline">Compete. Hustle. Glory. — Built on Passion.</p>
  </article>`;
}
