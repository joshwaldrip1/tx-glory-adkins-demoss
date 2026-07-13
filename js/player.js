import { getById } from "./api.js";
import { profile } from "./render.js";
import { SUPABASE_URL } from "./config.js";
import { TEAM } from "../data/team.js";

const id = new URLSearchParams(location.search).get("id");
const main = document.getElementById("main");

if (!id) {
  main.innerHTML = `<p class="error">No player specified.</p>`;
} else {
  try {
    const p = await getById(id);
    if (!p) main.innerHTML = `<p class="error">Player not found.</p>`;
    else {
      document.title = `${p.first_name} ${p.last_name} — Texas Glory Adkins-DeMoss`;
      main.innerHTML = profile(p, SUPABASE_URL, TEAM.logo);
    }
  } catch (e) {
    console.error(e);
    main.innerHTML = `<p class="error">Could not load this player.</p>`;
  }
}
