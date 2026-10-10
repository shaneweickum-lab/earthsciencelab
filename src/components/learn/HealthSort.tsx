"use client";

import { useState } from "react";

const CLUES = [
  { text: "Lots of earthworms in a shovelful", healthy: true, why: "Worms show the soil has food, air, and water." },
  { text: "A hard crust on the surface after rain", healthy: false, why: "Crusts form on bare soil with weak structure, blocking water and seedlings." },
  { text: "Dark color and a sweet, earthy smell", healthy: true, why: "Dark means organic matter. The smell is geosmin from busy bacteria." },
  { text: "Water puddles and runs off downhill", healthy: false, why: "Healthy soil soaks rain in. Runoff carries topsoil away." },
  { text: "Crumbly clumps that hold together in water", healthy: true, why: "Stable crumbs (aggregates) mean roots, fungi, and microbes are gluing soil together." },
  { text: "Roots that grow sideways and stop short", healthy: false, why: "That's a sign of compaction. Roots can't push down through squashed soil." },
  { text: "White fuzzy threads on old plant roots", healthy: true, why: "Those are fungal hyphae, a network that trades nutrients with plants." },
  { text: "Pale, dusty soil that blows in the wind", healthy: false, why: "Low organic matter and no cover. That's how the Dust Bowl started." },
  { text: "pH of 6.5", healthy: true, why: "Slightly acidic, the sweet spot for most crops." },
  { text: "A white salty crust in a dry field", healthy: false, why: "Salt buildup (salinization) poisons plants." },
];

export function HealthSort() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const done = Object.keys(answers).length;
  const right = CLUES.filter((c, i) => answers[i] === c.healthy).length;
  return (
    <div className="space-y-3">
      <ul className="grid gap-3 sm:grid-cols-2">
        {CLUES.map((c, i) => {
          const a = answers[i];
          const answered = a !== undefined;
          const correct = a === c.healthy;
          return (
            <li key={c.text} className={`rounded-xl border-2 p-3 ${!answered ? "border-line bg-white" : correct ? "border-leaf bg-leaf-light" : "border-danger bg-danger/10"}`}>
              <p className="font-bold">{c.text}</p>
              {!answered ? (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setAnswers({ ...answers, [i]: true })} className="btn btn-primary px-3 py-1 text-sm">💚 Healthy</button>
                  <button onClick={() => setAnswers({ ...answers, [i]: false })} className="btn btn-soil px-3 py-1 text-sm">🤒 Unhealthy</button>
                </div>
              ) : (
                <p className="mt-1 text-sm">
                  <strong>{correct ? "Yes! " : `Actually ${c.healthy ? "healthy" : "unhealthy"}. `}</strong>
                  {c.why}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-2 font-bold">
        <span>Diagnosed {done} / {CLUES.length}</span>
        <span>{done > 0 && `${right} correct`}</span>
        {done > 0 && <button onClick={() => setAnswers({})} className="text-sm text-muted underline">Reset</button>}
      </div>
    </div>
  );
}
