import { describe, it, expect } from "vitest";
import { text, hasAny, isPitcher, isCatcher, photoUrl, youTubeEmbed } from "../js/format.js";

describe("text", () => {
  it("blanks null/undefined", () => {
    expect(text(null)).toBe("");
    expect(text(undefined)).toBe("");
  });
  it("stringifies values", () => {
    expect(text(0)).toBe("0");
    expect(text(".412")).toBe(".412");
  });
});

describe("hasAny", () => {
  it("false for empty-ish", () => {
    expect(hasAny(null)).toBe(false);
    expect(hasAny({})).toBe(false);
    expect(hasAny({ a: "", b: null, c: [] })).toBe(false);
  });
  it("true when a real value exists", () => {
    expect(hasAny({ a: "", b: "2.9" })).toBe(true);
    expect(hasAny({ a: ["x"] })).toBe(true);
  });
});

describe("position checks", () => {
  it("detects pitcher/catcher", () => {
    expect(isPitcher(["P", "3B"])).toBe(true);
    expect(isPitcher(["SS"])).toBe(false);
    expect(isCatcher(["C"])).toBe(true);
    expect(isCatcher([])).toBe(false);
  });
});

describe("photoUrl", () => {
  it("builds a public storage url", () => {
    expect(photoUrl("maddie/photo.jpg", "https://x.supabase.co")).toBe(
      "https://x.supabase.co/storage/v1/object/public/player-photos/maddie/photo.jpg"
    );
  });
  it("falls back to placeholder", () => {
    expect(photoUrl("", "https://x.supabase.co")).toBe("assets/team/player-placeholder.png");
  });
});

describe("youTubeEmbed", () => {
  it("handles youtu.be and watch urls", () => {
    expect(youTubeEmbed("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(youTubeEmbed("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
  });
  it("returns null for non-youtube", () => {
    expect(youTubeEmbed("https://hudl.com/video/xyz")).toBeNull();
    expect(youTubeEmbed("")).toBeNull();
  });
  it("returns null for non-youtube urls that carry a v= param", () => {
    expect(youTubeEmbed("https://vimeo.com/watch?v=abc123")).toBeNull();
  });
});
