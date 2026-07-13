import { signUp, signIn, currentUser } from "./api.js";

const msg = document.getElementById("msg");
const email = document.getElementById("email");
const password = document.getElementById("password");

if (await currentUser()) location.href = "dashboard.html";

document.getElementById("login").addEventListener("click", async () => {
  msg.className = "notice"; msg.textContent = "Signing in…";
  const { error } = await signIn(email.value.trim(), password.value);
  if (error) { msg.className = "error"; msg.textContent = error.message; return; }
  location.href = "dashboard.html";
});

document.getElementById("signup").addEventListener("click", async () => {
  msg.className = "notice"; msg.textContent = "Creating account…";
  // Land the confirmation link back on this login page (a real, existing page).
  // supabase-js parses the token from the URL and the currentUser() check above
  // then forwards a confirmed parent to the dashboard.
  const redirectTo = location.origin + location.pathname;
  const { data, error } = await signUp(email.value.trim(), password.value, redirectTo);
  if (error) {
    msg.className = "error";
    // Supabase's built-in email sender is rate-limited (a few/hour). When a batch
    // of parents sign up at once, later ones hit this. Give a human explanation
    // instead of the raw "email rate limit exceeded".
    msg.textContent = /rate limit/i.test(error.message)
      ? "Too many signups just now — please wait a few minutes and try again, or contact the coach to be added."
      : error.message;
    return;
  }
  // If email confirmation is turned off in Supabase, signUp returns a session and
  // the parent is already logged in — send them straight to the dashboard.
  if (data?.session) { location.href = "dashboard.html"; return; }
  msg.textContent = "Check your email to confirm your account, then log in.";
});
