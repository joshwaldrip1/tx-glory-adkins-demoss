import { describe, it, expect } from "vitest";
import { formatGameDate, splitGames, gameCard, todayISO } from "../js/schedule.js";

describe("formatGameDate", () => {
  it("formats ISO dates", () => {
    expect(formatGameDate("2026-07-12")).toBe("Jul 12, 2026");
    expect(formatGameDate("2026-01-05")).toBe("Jan 5, 2026");
  });
  it("passes through junk", () => {
    expect(formatGameDate("")).toBe("");
    expect(formatGameDate("soon")).toBe("soon");
  });
});

describe("splitGames", () => {
  const games = [
    { game_date: "2026-07-01", event: "Past A" },
    { game_date: "2026-07-20", event: "Future A" },
    { game_date: "2026-07-10", event: "Today/edge" },
    { game_date: "2026-06-15", event: "Past B" },
  ];
  it("splits and sorts around today", () => {
    const { upcoming, past } = splitGames(games, "2026-07-10");
    expect(upcoming.map((g) => g.event)).toEqual(["Today/edge", "Future A"]); // today counts as upcoming, ascending
    expect(past.map((g) => g.event)).toEqual(["Past A", "Past B"]); // descending
  });
  it("ignores games without a date", () => {
    expect(splitGames([{ event: "x" }], "2026-07-10").upcoming).toEqual([]);
  });
});

describe("gameCard", () => {
  it("renders fields and escapes", () => {
    const html = gameCard({ game_date: "2026-07-20", game_time: "1:30 PM", event: "Summer Classic", opponent: "Buzz Gold", location: "Parsons Ranch", result: "" });
    expect(html).toContain("Jul 20, 2026");
    expect(html).toContain("1:30 PM");
    expect(html).toContain("Summer Classic — Buzz Gold");
    expect(html).toContain("Parsons Ranch");
  });
  it("shows result when present and escapes injection", () => {
    const html = gameCard({ game_date: "2026-07-01", event: "<script>", result: "W 7-3" });
    expect(html).toContain("W 7-3");
    expect(html).not.toContain("<script>");
  });
});

describe("todayISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
});
