import { listMine, savePlayer, uploadPhoto, deletePlayer, signOut, currentUser } from "./api.js";
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
         <span class="row-actions">
           <button class="btn" data-edit="${esc(p.id)}">Edit</button>
           <button class="btn btn-danger" data-del="${esc(p.id)}">Delete</button>
         </span></div>`).join("")
    : `<p class="notice">No players yet — add one below.</p>`;
  document.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => loadInto(players.find((p) => p.id === b.dataset.edit))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      const p = players.find((x) => x.id === b.dataset.del);
      if (!p) return;
      if (!confirm(`Delete ${p.first_name} ${p.last_name}? This permanently removes their profile and cannot be undone.`)) return;
      b.disabled = true;
      msg.className = "notice"; msg.textContent = "Deleting…";
      try {
        await deletePlayer(p.id);
        if ($("id").value === p.id) { $("form").reset(); $("id").value = ""; }
        msg.textContent = `Deleted ${p.first_name} ${p.last_name}.`;
        await refresh();
      } catch (e) {
        msg.className = "error"; msg.textContent = e.message; b.disabled = false;
      }
    }));
}

const splitList = (v) => v.split(",").map((s) => s.trim()).filter(Boolean);

function loadInto(p) {
  $("id").value = p.id;
  for (const k of ["first_name","last_name","jersey_number","grad_year","bats_throws","height","weight","hometown","school","gpa","video_url","guardian_name","guardian_email","guardian_phone"]) {
    $(k).value = p[k] ?? "";
  }
  $("positions").value = (p.positions ?? []).join(",");
  const b = p.bio || {};
  for (const k of ["about","dob","current_teams","about_me","player_email","player_phone","commitment","bat_glove","travel_org","hs_coach","ncsa_id","sportsrecruits_id","gamechanger_id"]) {
    $(k).value = b[k] ?? "";
  }
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
      bio: {
        about: $("about").value.trim(),
        dob: $("dob").value.trim(),
        current_teams: $("current_teams").value.trim(),
        about_me: $("about_me").value.trim(),
        player_email: $("player_email").value.trim(),
        player_phone: $("player_phone").value.trim(),
        commitment: $("commitment").value.trim(),
        bat_glove: $("bat_glove").value.trim(),
        travel_org: $("travel_org").value.trim(),
        hs_coach: $("hs_coach").value.trim(),
        ncsa_id: $("ncsa_id").value.trim(),
        sportsrecruits_id: $("sportsrecruits_id").value.trim(),
        gamechanger_id: $("gamechanger_id").value.trim(),
      },
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
    msg.textContent = "Saved — your player is live on the roster.";
    $("form").reset(); $("id").value = "";
    await refresh();
  } catch (err) {
    msg.className = "error"; msg.textContent = err.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

await refresh();
