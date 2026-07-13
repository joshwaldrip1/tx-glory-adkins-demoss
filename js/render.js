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
