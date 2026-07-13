import { describe, it, expect } from "vitest";
import { STAT_GROUPS, slugStat } from "../data/stat-catalog.js";

describe("slugStat", () => {
  it("produces safe, stable keys", () => {
    expect(slugStat("AVG")).toBe("avg");
    expect(slugStat("SB%")).toBe("sbpct");
    expect(slugStat("K/BB")).toBe("k_bb");
    expect(slugStat("K-L")).toBe("k_l");
    expect(slugStat("2S+3")).toBe("2splus3");
    expect(slugStat("#P")).toBe("nump");
    expect(slugStat("SB-ATT")).toBe("sb_att");
    expect(slugStat("GO/AO")).toBe("go_ao");
  });
  it("emits only [a-z0-9_] characters", () => {
    for (const g of STAT_GROUPS) {
      for (const s of g.stats) {
        expect(slugStat(s.label)).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });
});

describe("catalog integrity", () => {
  it("has the five expected groups", () => {
    expect(STAT_GROUPS.map((g) => g.key)).toEqual([
      "batting", "pitching", "fielding", "catching", "innings",
    ]);
  });

  it("every stat has a label and a name", () => {
    for (const g of STAT_GROUPS) {
      for (const s of g.stats) {
        expect(s.label, `${g.key} label`).toBeTruthy();
        expect(s.name, `${g.key}/${s.label} name`).toBeTruthy();
      }
    }
  });

  it("slugs are unique WITHIN each group (no silent collisions)", () => {
    for (const g of STAT_GROUPS) {
      const slugs = g.stats.map((s) => slugStat(s.label));
      const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
      expect(dupes, `${g.key} duplicate slugs: ${dupes.join(", ")}`).toEqual([]);
    }
  });

  it("labels are unique within each group", () => {
    for (const g of STAT_GROUPS) {
      const labels = g.stats.map((s) => s.label);
      const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
      expect(dupes, `${g.key} duplicate labels: ${dupes.join(", ")}`).toEqual([]);
    }
  });
});
