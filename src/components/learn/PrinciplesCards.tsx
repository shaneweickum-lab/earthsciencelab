"use client";

import { useState } from "react";

const CARDS = [
  { icon: "🚫🚜", practice: "No-till planting", principle: "Disturb the soil as little as possible", detail: "Seeds are slipped into the ground without plowing, so worm tunnels and fungal threads stay whole." },
  { icon: "🌾", practice: "Straw mulch", principle: "Keep the soil covered", detail: "A blanket of straw blocks raindrop splash and keeps the soil cool and moist." },
  { icon: "🌸🌽🫘", practice: "Planting many crops together", principle: "Grow diversity", detail: "Different plants feed different microbes and make it hard for pests to spread." },
  { icon: "🍀", practice: "Winter cover crops", principle: "Keep living roots in the ground", detail: "Roots keep feeding soil life even after the main crop is harvested." },
  { icon: "🐄", practice: "Rotational grazing", principle: "Bring in animals", detail: "Animals graze a small area briefly, leave manure, then move on so plants can regrow." },
  { icon: "🍂", practice: "Adding compost", principle: "Feed the soil life", detail: "Compost adds organic matter and billions of microbes. It's a key tool in organic farming." },
  { icon: "🌳", practice: "Hedgerows", principle: "Grow diversity", detail: "Shrubs on field edges house ladybugs and birds that eat pests, and block wind." },
  { icon: "🔄", practice: "Crop rotation", principle: "Grow diversity", detail: "Changing crops each season breaks pest life cycles and balances nutrients." },
];

export function PrinciplesCards() {
  const [flipped, setFlipped] = useState<number[]>([]);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((c, i) => {
        const open = flipped.includes(i);
        return (
          <button
            key={c.practice}
            onClick={() => setFlipped(open ? flipped.filter((f) => f !== i) : [...flipped, i])}
            className={`min-h-40 rounded-2xl border-2 p-3 text-center transition ${open ? "border-leaf bg-leaf-light" : "border-line bg-white hover:-translate-y-0.5"}`}
          >
            {!open ? (
              <>
                <div className="text-4xl">{c.icon}</div>
                <div className="mt-2 font-black">{c.practice}</div>
                <div className="mt-1 text-xs text-muted">Tap to flip</div>
              </>
            ) : (
              <div className="animate-pop-in">
                <div className="text-xs font-bold uppercase tracking-wider text-leaf">Principle</div>
                <div className="font-black">{c.principle}</div>
                <p className="mt-1 text-xs">{c.detail}</p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
