import { describe, expect, it } from "vitest";
import { SOIL_BUILDER_ZS } from "@/data/soilElements";
import {
  answerGlobeQuiz, completeLesson, EMPTY_PROGRESS, finishGame, levelFor, setGradeLevel, viewElement, visitRegion,
} from "./progressLogic";

const ALL = [{ slug: "what-is-soil", unit: 1 }, { slug: "soil-texture", unit: 2 }];

describe("progress logic", () => {
  it("pays lesson XP once and quiz XP only for improvement", () => {
    let d = completeLesson(EMPTY_PROGRESS, "what-is-soil", "middle", 3, 5, ALL).data;
    expect(d.xp).toBe(50 + 30);
    d = completeLesson(d, "what-is-soil", "middle", 3, 5, ALL).data;
    expect(d.xp).toBe(80);
    d = completeLesson(d, "what-is-soil", "middle", 5, 5, ALL).data;
    expect(d.xp).toBe(100);
  });

  it("awards lesson, perfect-quiz and all-lessons badges once", () => {
    const a = completeLesson(EMPTY_PROGRESS, "what-is-soil", "middle", 1, 5, ALL);
    expect(a.newBadges).toEqual(["dirt-detective", "unit-1"]);
    const b = completeLesson(a.data, "soil-texture", "middle", 5, 5, ALL);
    expect(b.newBadges).toEqual(["texture-master", "unit-2", "soil-scholar"]);
    const c = completeLesson(b.data, "soil-texture", "middle", 5, 5, ALL);
    expect(c.newBadges).toEqual([]);
  });

  it("can't farm quiz XP by switching grade levels", () => {
    let d = completeLesson(EMPTY_PROGRESS, "what-is-soil", "elementary", 5, 5, ALL).data;
    expect(d.xp).toBe(50 + 50);
    d = completeLesson(d, "what-is-soil", "high", 5, 6, ALL).data;
    expect(d.xp).toBe(100);
    d = completeLesson(d, "what-is-soil", "high", 6, 6, ALL).data;
    expect(d.xp).toBe(110);
    expect(d.quizScores["what-is-soil:elementary"].correct).toBe(5);
    expect(d.quizScores["what-is-soil:high"].correct).toBe(6);
  });

  it("awards a unit badge only when every lesson in the unit is done", () => {
    const lessons = [{ slug: "a", unit: 1 }, { slug: "b", unit: 1 }, { slug: "c", unit: 2 }];
    const one = completeLesson(EMPTY_PROGRESS, "a", "middle", 1, 5, lessons);
    expect(one.newBadges).not.toContain("unit-1");
    expect(completeLesson(one.data, "b", "middle", 1, 5, lessons).newBadges).toContain("unit-1");
  });

  it("remembers the grade level", () => {
    expect(EMPTY_PROGRESS.gradeLevel).toBe("middle");
    expect(setGradeLevel(EMPTY_PROGRESS, "high").data.gradeLevel).toBe("high");
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

  it("counts element views once and awards element badges", () => {
    const a = viewElement(EMPTY_PROGRESS, 26);
    expect(a.newBadges).toEqual(["element-spotter"]);
    expect(viewElement(a.data, 26).data).toBe(a.data);
    let d = a.data;
    for (let z = 1; z <= 118; z++) d = viewElement(d, z).data;
    expect(d.viewedElements).toHaveLength(118);
    expect(d.badges).toEqual(expect.arrayContaining(["lab-regular", "table-master"]));
    expect(d.xp).toBe(118 * 2);
  });

  it("awards Soil Chemist after every soil builder is explored", () => {
    let d = EMPTY_PROGRESS;
    const last = SOIL_BUILDER_ZS[SOIL_BUILDER_ZS.length - 1];
    for (const z of SOIL_BUILDER_ZS.slice(0, -1)) d = viewElement(d, z).data;
    expect(d.badges).not.toContain("soil-chemist");
    expect(viewElement(d, last).newBadges).toContain("soil-chemist");
  });

  it("computes levels", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(199)).toBe(1);
    expect(levelFor(400)).toBe(3);
  });
});
