"use client";

import { CATEGORY_INFO, ELEMENTS, tilePosition, type ElementCategory } from "@/data/elements";
import { SOIL_BY_Z, SOIL_ROLES, type SoilRole } from "@/data/soilElements";

interface Props {
  selected: number | null;
  onSelect: (z: number) => void;
  filter: ElementCategory | null;
  matches: Set<number> | null;
  viewed: number[];
  soilLens: boolean;
  soilRole: SoilRole | null;
}

/** Flat, keyboard-friendly table. Also the default on small screens. */
export function PeriodicGrid2D({ selected, onSelect, filter, matches, viewed, soilLens, soilRole }: Props) {
  return (
    <div className={`overflow-x-auto rounded-2xl p-3 ${soilLens ? "soil-texture-bg" : "bg-[#141b2d]"}`}>
      <div className="grid min-w-[760px] gap-1" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(7, auto) 12px repeat(2, auto)" }}>
        {ELEMENTS.map((el) => {
          const { col, row } = tilePosition(el);
          const soil = SOIL_BY_Z.get(el.z);
          const soilMatch = soil && (soilRole === null || soil.roles.includes(soilRole));
          const dimmed =
            (filter !== null && el.category !== filter) || (matches !== null && !matches.has(el.z)) || (soilLens && !soilMatch);
          const ring = soilLens && soilMatch ? SOIL_ROLES[soilRole ?? soil.roles[0]].color : undefined;
          return (
            <button
              key={el.z}
              onClick={() => onSelect(el.z)}
              aria-label={`${el.z} ${el.name}${soil ? ", found in soil" : ""}`}
              aria-pressed={selected === el.z}
              style={{ gridColumn: col, gridRow: row, background: CATEGORY_INFO[el.category].color, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}
              className={`relative aspect-square rounded-md p-0.5 text-left text-ink transition hover:scale-110 hover:z-10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-white ${
                selected === el.z ? "z-10 scale-110 ring-2 ring-white" : ""
              } ${dimmed ? "opacity-20" : ""}`}
            >
              <span className="block text-[9px] font-bold leading-none">{el.z}</span>
              <span className="block text-center text-sm font-black leading-tight">{el.symbol}</span>
              {viewed.includes(el.z) && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-white/80" />}
              {soil && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 rounded-b-md bg-soil" />}
            </button>
          );
        })}
        {(["57–71", "89–103"] as const).map((label, i) => (
          <div key={label} style={{ gridColumn: 3, gridRow: 6 + i, background: CATEGORY_INFO[i ? "actinide" : "lanthanide"].color }} className="grid aspect-square place-items-center rounded-md text-[9px] font-bold text-ink opacity-70">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
