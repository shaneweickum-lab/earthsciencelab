import { Fragment } from "react";
import { ElementLink } from "./ElementLink";

/** Element names worth linking when they appear in lesson text. */
const LINKABLE: Record<string, number> = {
  hydrogen: 1, carbon: 6, nitrogen: 7, oxygen: 8, sodium: 11, magnesium: 12, aluminum: 13, silicon: 14,
  phosphorus: 15, sulfur: 16, potassium: 19, calcium: 20, iron: 26,
};

const PATTERN = new RegExp(`\\b(${Object.keys(LINKABLE).join("|")})\\b`, "gi");

/** Turn the first mention of each element in a paragraph into a periodic table link. */
export function linkElements(text: string): React.ReactNode {
  const seen = new Set<string>();
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(PATTERN)) {
    const key = m[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(text.slice(last, m.index));
    parts.push(<ElementLink key={m.index} z={LINKABLE[key]}>{m[0]}</ElementLink>);
    last = m.index! + m[0].length;
  }
  if (parts.length === 0) return text;
  parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}
