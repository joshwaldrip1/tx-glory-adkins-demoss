import { describe, it, expect } from "vitest";
import { esc, statTile, panel, playerCard, profile } from "../js/render.js";
import { pitcher, minimalInfielder } from "./fixtures/player.js";

const BASE = "https://x.supabase.co";

describe("esc", () => {
  it("escapes html", () => {
    expect(esc('<b>"&')).toBe("&lt;b&gt;&quot;&amp;");
  });
});

describe("statTile", () => {
  it("renders label + value", () => {
    const html = statTile("AVG", ".386");
    expect(html).toContain(".386");
    expect(html).toContain("AVG");
  });
  it("collapses when blank", () => {
    expect(statTile("HR", "")).toBe("");
  });
});

describe("panel", () => {
  it("collapses when empty inner", () => {
    expect(panel("Pitching", "")).toBe("");
  });
  it("shows title when inner present", () => {
    expect(panel("Pitching", "<div>x</div>")).toContain("Pitching");
  });
});

describe("playerCard", () => {
  it("links to the profile by id and shows name", () => {
    const html = playerCard(pitcher, BASE);
    expect(html).toContain('href="player.html?id=charley-waldrip"');
    expect(html).toContain("Charley");
    expect(html).toContain("Waldrip");
  });
});

describe("profile", () => {
  it("shows pitching panel for a pitcher", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Pitching");
    expect(html).toContain("55 mph");
  });
  it("embeds youtube video", () => {
    expect(profile(pitcher, BASE)).toContain("https://www.youtube.com/embed/abc123");
  });
  it("shows guardian contact but never player DOB/phone fields", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Josh Waldrip");
    expect(html).not.toMatch(/date of birth/i);
  });
  it("omits pitching + catching + academics panels when data absent", () => {
    const html = profile(minimalInfielder, BASE);
    expect(html).not.toContain("Pitching");
    expect(html).not.toContain("Catching");
    expect(html).not.toContain("Academic");
  });
});
