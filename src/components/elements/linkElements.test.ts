import { describe, expect, it } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { ElementLink } from "./ElementLink";
import { linkElements } from "./linkElements";

function links(node: React.ReactNode): number[] {
  if (!Array.isArray(node)) return [];
  return node
    .map((frag) => (frag as ReactElement<{ children: React.ReactNode }>).props.children)
    .filter((c): c is ReactElement<{ z: number }> => isValidElement(c) && c.type === ElementLink)
    .map((c) => c.props.z);
}

describe("linkElements", () => {
  it("leaves plain text alone", () => {
    expect(linkElements("Soil is alive.")).toBe("Soil is alive.");
  });
  it("links the first mention of each element only", () => {
    expect(links(linkElements("Nitrogen (N), phosphorus (P), and more nitrogen."))).toEqual([7, 15]);
  });
  it("doesn't match inside other words", () => {
    expect(linkElements("Ironing boards and carbonated drinks")).toBe("Ironing boards and carbonated drinks");
  });
});
