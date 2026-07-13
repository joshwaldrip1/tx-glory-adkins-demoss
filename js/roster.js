import { TEAM } from "../data/team.js";
import { listApproved } from "./api.js";
import { playerCard } from "./render.js";
import { SUPABASE_URL } from "./config.js";

document.getElementById("team-name").textContent = TEAM.shortName;
document.getElementById("tagline").textContent = `${TEAM.taglinePrimary} — ${TEAM.taglineSecondary}`;
const logo = document.getElementById("logo");
logo.src = TEAM.logo;
document.getElementById("coach").innerHTML =
  `<h2 class="panel-title">Coach Contact</h2>
   <div class="panel-body"><div class="info-row"><span class="info-label">Coach</span><span class="info-value">${TEAM.coach.name}</span></div>
   <div class="info-row"><span class="info-label">Email</span><span class="info-value">${TEAM.coach.email}</span></div></div>`;

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
