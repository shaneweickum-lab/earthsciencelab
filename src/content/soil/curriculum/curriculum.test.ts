import { describe, expect, it } from "vitest";
import { SOURCE_IDS, SOURCES } from "../sources";
import { CURRICULUM, LEVELS, PLANNED_SLUGS, UNITS } from "./index";

const STANDARD_PATTERN = {
  elementary: /^[K1-5]-(PS|LS|ESS|ETS)\d-\d$/,
  middle: /^MS-(PS|LS|ESS|ETS)\d-\d$/,
  high: /^HS-(PS|LS|ESS|ETS)\d-\d$/,
};

describe("soil curriculum", () => {
  it("has unique slugs from the planned list", () => {
    const slugs = CURRICULUM.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(PLANNED_SLUGS).toContain(s);
  });

  it.each(CURRICULUM)("$slug belongs to a real unit and cites real sources", (lesson) => {
    expect(UNITS.some((u) => u.number === lesson.unit)).toBe(true);
    expect(lesson.sources.length).toBeGreaterThanOrEqual(2);
    for (const id of lesson.sources) expect(SOURCES[id]).toBeDefined();
    expect(lesson.bigIdea.length).toBeGreaterThan(20);
  });

  it.each(CURRICULUM)("$slug has complete content at every level", (lesson) => {
    for (const level of LEVELS) {
      const c = lesson.levels[level];
      expect(c.objectives.length, `${level} objectives`).toBeGreaterThanOrEqual(2);
      expect(c.vocab.length, `${level} vocab`).toBeGreaterThanOrEqual(3);
      expect(c.sections.length, `${level} sections`).toBeGreaterThanOrEqual(2);
      expect(c.activity.steps.length, `${level} activity`).toBeGreaterThanOrEqual(3);
      expect(c.activity.materials.length).toBeGreaterThanOrEqual(1);
      expect(c.quiz.length, `${level} quiz`).toBeGreaterThanOrEqual(5);
      for (const q of c.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.explain.length).toBeGreaterThan(10);
      }
      for (const s of c.sections) {
        if (s.source) expect(lesson.sources).toContain(s.source);
      }
      // Correct answers shouldn't always sit in the same spot.
      const spots = new Set(c.quiz.map((q) => q.answer));
      expect(spots.size, `${level} answer positions`).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(CURRICULUM)("$slug lists NGSS standards in the right grade band", (lesson) => {
    for (const level of LEVELS) {
      expect(lesson.standards[level].length).toBeGreaterThanOrEqual(1);
      for (const code of lesson.standards[level]) expect(code).toMatch(STANDARD_PATTERN[level]);
    }
  });

  it("cites every source in the registry somewhere", () => {
    if (CURRICULUM.length < PLANNED_SLUGS.length) return; // checked once every unit is written
    const used = new Set(CURRICULUM.flatMap((l) => l.sources));
    for (const id of SOURCE_IDS) expect(used.has(id), id).toBe(true);
  });

  it("includes every planned lesson", () => {
    expect(CURRICULUM.map((l) => l.slug).sort()).toEqual([...PLANNED_SLUGS].sort());
  });
});
