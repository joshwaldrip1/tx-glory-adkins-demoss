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
  const { error } = await signUp(email.value.trim(), password.value);
  if (error) { msg.className = "error"; msg.textContent = error.message; return; }
  msg.textContent = "Check your email to confirm your account, then log in.";
});
