"use client";

import { BADGES } from "@/store/badges";
import { useProgress } from "@/store/progress";

export function BadgeShelf() {
  const earned = useProgress((s) => s.badges);
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-black">Badges</h2>
        <span className="text-sm font-semibold text-muted">
          {earned.length} of {Object.keys(BADGES).length} earned
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Object.values(BADGES).map((b) => {
          const has = earned.includes(b.id);
          return (
            <li
              key={b.id}
              title={b.description}
              className={`flex flex-col items-center rounded-xl border p-3 text-center ${
                has ? "border-sun bg-sun/15" : "border-line opacity-50 grayscale"
              }`}
            >
              <span className="text-3xl">{has ? b.icon : "🔒"}</span>
              <span className="mt-1 text-xs font-bold leading-tight">{b.name}</span>
              <span className="mt-1 text-[11px] leading-tight text-muted">{b.description}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
