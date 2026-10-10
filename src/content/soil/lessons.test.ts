import { describe, expect, it } from "vitest";
import { LESSONS } from "./lessons";

describe("lessons", () => {
  it.each(LESSONS)("$slug has a valid quiz", (lesson) => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(4);
    for (const q of lesson.quiz) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });
  it("has unique slugs", () => {
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
  });
});
