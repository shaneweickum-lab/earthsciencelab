import { describe, expect, it } from "vitest";
import {
  answerGlobeQuiz, completeLesson, EMPTY_PROGRESS, finishGame, levelFor, visitRegion,
} from "./progressLogic";

const ALL = ["what-is-soil", "soil-texture"];

describe("progress logic", () => {
  it("pays lesson XP once and quiz XP only for improvement", () => {
    let d = completeLesson(EMPTY_PROGRESS, "what-is-soil", 3, 5, ALL).data;
    expect(d.xp).toBe(50 + 30);
    d = completeLesson(d, "what-is-soil", 3, 5, ALL).data;
    expect(d.xp).toBe(80);
    d = completeLesson(d, "what-is-soil", 5, 5, ALL).data;
    expect(d.xp).toBe(100);
  });

  it("awards lesson, perfect-quiz and all-lessons badges once", () => {
    const a = completeLesson(EMPTY_PROGRESS, "what-is-soil", 1, 5, ALL);
    expect(a.newBadges).toEqual(["dirt-detective"]);
    const b = completeLesson(a.data, "soil-texture", 5, 5, ALL);
    expect(b.newBadges).toEqual(["texture-master", "soil-scholar"]);
    const c = completeLesson(b.data, "soil-texture", 5, 5, ALL);
    expect(c.newBadges).toEqual([]);
  });

  it("counts region visits once and unlocks Soil Explorer at 10", () => {
    let d = EMPTY_PROGRESS;
    for (let i = 0; i < 10; i++) d = visitRegion(d, `r${i}`).data;
    d = visitRegion(d, "r0").data;
    expect(d.visitedRegions).toHaveLength(10);
    expect(d.badges).toContain("soil-explorer");
    expect(d.xp).toBe(50);
  });

  it("tracks globe quiz answers", () => {
    let d = EMPTY_PROGRESS;
    for (let i = 0; i < 10; i++) d = answerGlobeQuiz(d, true).data;
    d = answerGlobeQuiz(d, false).data;
    expect(d.globeQuizCorrect).toBe(10);
    expect(d.badges).toContain("world-soil-expert");
  });

  it("records the best game", () => {
    const a = finishGame(EMPTY_PROGRESS, 2, 74);
    expect(a.newBadges).toEqual(["first-harvest", "field-restorer"]);
    const b = finishGame(a.data, 1, 55);
    expect(b.data.bestGameStars).toBe(2);
    expect(b.data.bestGameHealth).toBe(74);
  });

  it("computes levels", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(199)).toBe(1);
    expect(levelFor(400)).toBe(3);
  });
});
