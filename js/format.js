export function text(v) {
  return v === null || v === undefined ? "" : String(v);
}

export function hasAny(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

export function isPitcher(positions) {
  return Array.isArray(positions) && positions.includes("P");
}

export function isCatcher(positions) {
  return Array.isArray(positions) && positions.includes("C");
}

export function photoUrl(path, baseUrl) {
  if (!path) return "assets/team/player-placeholder.png";
  return `${baseUrl}/storage/v1/object/public/player-photos/${path}`;
}

export function youTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
