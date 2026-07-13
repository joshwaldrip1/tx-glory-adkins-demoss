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
  it("adds a title tooltip when provided", () => {
    expect(statTile("AVG", ".386", "Batting average")).toContain('title="Batting average"');
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
  it("shows only the groups the player has data for", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Batting");
    expect(html).toContain(".386");
    expect(html).toContain("Pitching");
    expect(html).toContain("55 mph");
    expect(html).toContain("Fielding");
    // pitcher has no catching or innings data → those panels must not appear
    expect(html).not.toContain("Catching");
    expect(html).not.toContain("Innings Played");
  });
  it("embeds youtube video", () => {
    expect(profile(pitcher, BASE)).toContain("https://www.youtube.com/embed/abc123");
  });
  it("shows guardian contact but never player DOB/phone fields", () => {
    const html = profile(pitcher, BASE);
    expect(html).toContain("Josh Waldrip");
    expect(html).not.toMatch(/date of birth/i);
  });
  it("omits every stat group except the one with data", () => {
    const html = profile(minimalInfielder, BASE);
    expect(html).toContain("Batting"); // has avg
    expect(html).toContain(".300");
    expect(html).not.toContain("Pitching");
    expect(html).not.toContain("Catching");
    expect(html).not.toContain("Fielding");
    expect(html).not.toContain("Innings Played");
    expect(html).not.toContain("Academic");
  });
  it("omits the Player Stats section entirely when no stats are filled", () => {
    const html = profile({ ...minimalInfielder, stats: {} }, BASE);
    expect(html).not.toContain("Player Stats");
    expect(html).not.toContain("stat-cards");
  });
  it("drops non-http(s) links like javascript: and data:", () => {
    const html = profile({ ...pitcher, video_url: "javascript:alert(1)", profile_url: "data:text/html,x" }, BASE);
    expect(html).not.toContain("javascript:alert");
    expect(html).not.toContain("data:text/html");
  });
  it("escapes injected markup in text fields", () => {
    const html = profile({ ...pitcher, first_name: "<script>alert(1)</script>" }, BASE);
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
