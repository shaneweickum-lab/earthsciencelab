"use client";

import { LESSONS } from "@/content/soil/lessons";
import { SOIL_REGIONS } from "@/data/soilRegions";
import { useProgress } from "@/store/progress";

export function SoilStats() {
  const lessons = useProgress((s) => s.completedLessons.length);
  const regions = useProgress((s) => s.visitedRegions.length);
  const pages = useProgress((s) => s.natureFound.length);
  const stats = [
    { label: "Lessons", value: `${lessons}/${LESSONS.length}` },
    { label: "Journal", value: pages ? `📓 ${pages}` : "–" },
    { label: "Regions", value: `${regions}/${SOIL_REGIONS.length}` },
  ];
  return (
    <div className="flex gap-2">
      {stats.map((s) => (
        <div key={s.label} className="card min-w-24 px-4 py-2 text-center">
          <div className="text-lg font-black">{s.value}</div>
          <div className="text-xs font-semibold text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
