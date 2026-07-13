import { listMine, savePlayer, uploadPhoto, signOut, currentUser } from "./api.js";
import { esc } from "./render.js";

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
        `<div class="info-row"><span class="info-value">#${esc(p.jersey_number ?? "")} ${esc(p.first_name)} ${esc(p.last_name)}
         — <em>${esc(p.status)}</em></span>
         <button class="btn" data-edit="${esc(p.id)}" style="margin-left:auto">Edit</button></div>`).join("")
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
      stats: { avg: $("avg").value.trim(), obp: $("obp").value.trim() },
      metrics: { pitching: { era: $("era").value.trim(), velo: $("velo").value.trim() } },
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  }
});

await refresh();
