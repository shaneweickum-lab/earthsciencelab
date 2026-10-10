import { describe, expect, it } from "vitest";
import { ELEMENTS, findElements, getElement, neutrons, tilePosition } from "./elements";

describe("elements", () => {
  it("has all 118 in order with unique symbols", () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((el, i) => expect(el.z).toBe(i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
  });

  it.each(ELEMENTS)("$name has shells adding up to its atomic number", (el) => {
    expect(el.shells.reduce((a, b) => a + b, 0)).toBe(el.z);
    // Palladium is the one real exception: its 5th shell is empty (4d10 5s0).
    expect(el.shells.length).toBe(el.symbol === "Pd" ? 4 : el.period);
    expect(neutrons(el)).toBeGreaterThanOrEqual(0);
  });

  it("places every element on a unique tile", () => {
    const seen = new Set<string>();
    for (const el of ELEMENTS) {
      const { col, row } = tilePosition(el);
      expect(col).toBeGreaterThanOrEqual(1);
      expect(col).toBeLessThanOrEqual(18);
      const key = `${col},${row}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("puts lanthanides and actinides in their own rows", () => {
    expect(tilePosition(getElement(57)!)).toEqual({ col: 3, row: 9 });
    expect(tilePosition(getElement(71)!)).toEqual({ col: 17, row: 9 });
    expect(tilePosition(getElement(103)!)).toEqual({ col: 17, row: 10 });
    expect(tilePosition(getElement(26)!)).toEqual({ col: 8, row: 4 });
  });

  it("uses common isotopes for neutron counts", () => {
    expect(neutrons(getElement(6)!)).toBe(6);
    expect(neutrons(getElement(17)!)).toBe(18);
    expect(neutrons(getElement(29)!)).toBe(34);
    expect(neutrons(getElement(92)!)).toBe(146);
  });

  it("searches by number, symbol, and name", () => {
    expect(findElements("26")[0].name).toBe("Iron");
    expect(findElements("fe")[0].name).toBe("Iron");
    expect(findElements("iro")[0].name).toBe("Iron");
    expect(findElements("n")[0].symbol).toBe("N");
    expect(findElements("")).toEqual([]);
  });
});
