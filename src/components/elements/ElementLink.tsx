"use client";

import { getElement } from "@/data/elements";
import { useElementsPanel } from "@/store/elementsPanel";

/** Inline link that opens the periodic table overlay on one element. */
export function ElementLink({ z, children }: { z: number; children: React.ReactNode }) {
  const open = useElementsPanel((s) => s.open);
  const el = getElement(z);
  return (
    <button
      type="button"
      onClick={() => open(z)}
      title={el ? `Open ${el.name} in the periodic table` : undefined}
      className="inline rounded px-0.5 font-semibold text-sky underline decoration-dotted underline-offset-2 hover:bg-sky/10"
    >
      {children}
    </button>
  );
}
