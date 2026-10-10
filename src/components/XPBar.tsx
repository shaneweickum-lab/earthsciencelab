"use client";

import { levelFor, XP_PER_LEVEL } from "@/store/progressLogic";
import { useProgress } from "@/store/progress";

export function XPBar({ compact = false }: { compact?: boolean }) {
  const xp = useProgress((s) => s.xp);
  const level = levelFor(xp);
  const into = xp % XP_PER_LEVEL;
  return (
    <div className="flex items-center gap-2" title={`${xp} XP total`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-sm font-black text-soil-dark">
        {level}
      </span>
      <div className={compact ? "w-20 sm:w-28" : "w-40"}>
        <div className="h-2.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-leaf transition-all duration-500" style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} />
        </div>
        <div className="mt-0.5 text-[11px] font-semibold text-muted">
          {into} / {XP_PER_LEVEL} XP
        </div>
      </div>
    </div>
  );
}
