import { GRADE_INFO } from "@/world/grades";
import { ITEMS } from "@/world/items";
import type { Grade } from "@/world/types";

/** An item's picture icon (or its emoji when it has none), with a grade badge for graded produce. */
export function ItemIcon({ id, grade, className = "" }: { id: string; grade?: Grade; className?: string }) {
  const def = ITEMS[id];
  const icon = def.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={def.image} alt="" aria-hidden className={`h-[1.6em] w-[1.6em] object-contain ${className}`} draggable={false} />
  ) : (
    <span aria-hidden className={className}>{def.icon}</span>
  );
  if (!grade) return icon;
  return (
    <span className="relative inline-flex">
      {icon}
      <GradeBadge grade={grade} className="absolute -right-1.5 -top-1" />
    </span>
  );
}

export function GradeBadge({ grade, className = "" }: { grade: Grade; className?: string }) {
  const g = GRADE_INFO[grade];
  return (
    <span
      className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-black leading-none shadow ${className}`}
      style={{ background: g.color, color: g.text }}
      title={`Grade ${grade}`}
      aria-label={`Grade ${grade}`}
    >
      {grade}
    </span>
  );
}
