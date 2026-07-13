import { TEAM } from "../data/team.js";
import { listGames } from "./api.js";
import { scheduleHtml, todayISO } from "./schedule.js";

document.getElementById("team-name").textContent = TEAM.shortName;
document.getElementById("logo").src = TEAM.logo;

// Gold text ribbon (no bespoke art for these section titles).
const ribbon = (t) => `<div class="ribbon"><span><span>${t}</span></span></div>`;

const sched = document.getElementById("sched");
try {
  const games = await listGames();
  sched.innerHTML = scheduleHtml(games, todayISO(), ribbon);
} catch (e) {
  console.error(e);
  sched.innerHTML = `<p class="error">Could not load the schedule right now. Please try again later.</p>`;
}
