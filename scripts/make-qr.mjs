import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";

const url = process.argv[2];
if (!url) { console.error("Usage: npm run qr -- <roster-url>"); process.exit(1); }

await mkdir("assets/team", { recursive: true });
await QRCode.toFile("assets/team/qr-roster.png", url, {
  width: 800, margin: 2,
  color: { dark: "#0E0E0E", light: "#FFFFFF" },
});
console.log("Wrote assets/team/qr-roster.png →", url);
