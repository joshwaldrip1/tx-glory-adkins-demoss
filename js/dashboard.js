import { listMine, savePlayer, uploadPhoto, signOut, currentUser } from "./api.js";
import { esc } from "./render.js";
import { STAT_GROUPS, slugStat } from "../data/stat-catalog.js";

if (!(await currentUser())) location.href = "login.html";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

document.getElementById("logout").addEventListener("click", async () => {
  await signOut(); location.href = "index.html";
});

// --- Build the collapsible, grouped stat form from the catalog ---
function statField(groupKey, s) {
  const slug = slugStat(s.label);
  const id = `stat_${groupKey}_${slug}`;
  return `<div class="field">
    <label for="${id}" title="${esc(s.name)}">${esc(s.label)} <span class="field-hint">${esc(s.name)}</span></label>
    <input id="${id}" data-group="${groupKey}" data-slug="${slug}" autocomplete="off">
  </div>`;
}

function buildStatForm() {
  $("stat-groups").innerHTML = STAT_GROUPS.map((g, i) => {
    const core = g.stats.filter((s) => s.core);
    const adv = g.stats.filter((s) => !s.core);
    const coreHtml = `<div class="statgrid">${core.map((s) => statField(g.key, s)).join("")}</div>`;
    const advHtml = adv.length
      ? `<details class="statgroup-adv"><summary>Advanced (${adv.length})</summary>
           <div class="statgrid">${adv.map((s) => statField(g.key, s)).join("")}</div></details>`
      : "";
    return `<details class="statgroup"${i === 0 ? " open" : ""}>
      <summary class="statgroup-title">${esc(g.title)}</summary>
      ${coreHtml}${advHtml}
    </details>`;
  }).join("");
}

function statInputs() {
  return document.querySelectorAll('#stat-groups [data-slug]');
}

// Collect non-empty stat inputs into { group: { slug: value } }, groups with data only.
function collectStats() {
  const stats = {};
  statInputs().forEach((el) => {
    const v = el.value.trim();
    if (!v) return;
    (stats[el.dataset.group] ||= {})[el.dataset.slug] = v;
  });
  return stats;
}

buildStatForm();

async function refresh() {
  const players = await listMine();
  $("mine").innerHTML = players.length
    ? players.map((p) =>
        `<div class="info-row"><span class="info-value">#${esc(p.jersey_number ?? "")} ${esc(p.first_name)} ${esc(p.last_name)}
         — <em>${esc(p.status)}</em></span>
         <button class="btn" data-edit="${esc(p.id)}" style="margin-left:auto">Edit</button></div>`).join("")
    : `<p class="notice">No players yet — add one below.</p>`;
  document.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => loadInto(players.find((p) => p.id === b.dataset.edit))));
}

const splitList = (v) => v.split(",").map((s) => s.trim()).filter(Boolean);

function loadInto(p) {
  $("id").value = p.id;
  for (const k of ["first_name","last_name","jersey_number","grad_year","bats_throws","height","weight","hometown","school","gpa","video_url","guardian_name","guardian_email","guardian_phone"]) {
    $(k).value = p[k] ?? "";
  }
  $("positions").value = (p.positions ?? []).join(",");
  $("about").value = p.bio?.about ?? "";
  $("honor_roll").value = p.academics?.honor_roll ?? "";
  $("awards").value = (p.academics?.awards ?? []).join(", ");
  $("interests").value = (p.academics?.interests ?? []).join(", ");
  $("achievements").value = (p.achievements ?? []).join(", ");
  const st = p.stats || {};
  statInputs().forEach((el) => {
    el.value = st[el.dataset.group]?.[el.dataset.slug] ?? "";
  });
  msg.className = "notice";
  msg.textContent = `Editing ${p.first_name} ${p.last_name}`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "notice"; msg.textContent = "Saving…";
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (submitBtn) submitBtn.disabled = true;
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
      weight: $("weight").value.trim(),
      hometown: $("hometown").value.trim(),
      school: $("school").value.trim(),
      gpa: $("gpa").value ? Number($("gpa").value) : null,
      bio: { about: $("about").value.trim() },
      academics: {
        honor_roll: $("honor_roll").value.trim(),
        awards: splitList($("awards").value),
        interests: splitList($("interests").value),
      },
      achievements: splitList($("achievements").value),
      stats: collectStats(),
      video_url: $("video_url").value.trim(),
      guardian_name: $("guardian_name").value.trim(),
      guardian_email: $("guardian_email").value.trim(),
      guardian_phone: $("guardian_phone").value.trim(),
    };
    const saved = await savePlayer(player);
    $("id").value = saved.id;
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
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

await refresh();
