// Public, non-secret. The publishable key is safe in client code; RLS is the guard.
// NEVER put the sb_secret_... key here — it bypasses RLS and must stay server-side only.
export const SUPABASE_URL = "https://mgjhwznanjnksxdlxsnp.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Kkumjoftk1L07iZKt2LPug_y9m9k05T";
