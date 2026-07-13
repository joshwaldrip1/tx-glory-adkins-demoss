import { supabase } from "./supabaseClient.js";

const COLUMNS = "*";

export async function listApproved() {
  const { data, error } = await supabase
    .from("players").select(COLUMNS)
    .eq("status", "approved")
    .order("jersey_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getById(id) {
  const { data, error } = await supabase
    .from("players").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listMine() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("players").select(COLUMNS).eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function savePlayer(player) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const row = { ...player, owner_id: user.id, status: "approved" };
  const { data, error } = await supabase
    .from("players").upsert(row).select().single();
  if (error) throw error;
  return data;
}

export async function uploadPhoto(playerId, file) {
  const path = `${playerId}/photo.jpg`;
  const { error } = await supabase.storage
    .from("player-photos").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "60" });
  if (error) throw error;
  return path;
}

export async function deletePlayer(id) {
  // Best-effort photo cleanup (ignore if none); RLS lets an owner delete only their own row.
  await supabase.storage.from("player-photos").remove([`${id}/photo.jpg`]);
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
}

// --- Team schedule ---
export async function listGames() {
  const { data, error } = await supabase
    .from("games").select("*").order("game_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) return false;
  return !!data;
}

export async function saveGame(game) {
  const { data, error } = await supabase.from("games").upsert(game).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGame(id) {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw error;
}

// emailRedirectTo controls where the confirmation-email link lands after Supabase
// verifies the token. On GitHub Pages the site is served from a subpath, so we
// pass the login page's full URL explicitly — otherwise Supabase falls back to
// the project's "Site URL", and a misconfigured one sends parents to a 404.
export const signUp = (email, password, emailRedirectTo) =>
  supabase.auth.signUp({ email, password, options: emailRedirectTo ? { emailRedirectTo } : undefined });
export const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const currentUser = async () => (await supabase.auth.getUser()).data.user;
