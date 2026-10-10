"use client";

import Link from "next/link";
import { CATEGORY_INFO, getElement } from "@/data/elements";
import { SOIL_BUILDER_ZS, SOIL_ELEMENTS, SOIL_RECIPE, SOIL_ROLES, type SoilRole } from "@/data/soilElements";

const RECIPE_COLORS = ["#7d5a3c", "#c9a865", "#b07a4a", "#a0522d", "#2e1c10", "#e9dcc0", "#8a6f4e", "#d8b98a", "#5f7a3a", "#a39a8c"];

interface Props {
  role: SoilRole | null;
  onRole: (r: SoilRole | null) => void;
  onSelect: (z: number) => void;
  viewed: number[];
}

/** Controls and context shown while the Soil Builders lens is on. */
export function SoilLens({ role, onRole, onSelect, viewed }: Props) {
  const explored = SOIL_BUILDER_ZS.filter((z) => viewed.includes(z)).length;
  const top = SOIL_RECIPE.slice(0, 9);
  const rest = Math.max(0, 100 - top.reduce((s, r) => s + r.percent, 0));

  return (
    <section className="card space-y-4 p-4" aria-label="Soil builders">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-black">🪱 The building blocks of soil</h2>
        <span className="text-sm font-bold text-muted">
          Soil builders explored {explored} / {SOIL_BUILDER_ZS.length}
        </span>
      </div>

      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">What soil is made of, by weight</div>
        <div className="flex h-12 overflow-hidden rounded-xl ring-1 ring-black/10">
          {top.map((r, i) => {
            const el = getElement(r.z)!;
            return (
              <button
                key={r.z}
                onClick={() => onSelect(r.z)}
                title={`${el.name}: about ${r.percent}%`}
                aria-label={`${el.name}, about ${r.percent} percent of soil`}
                className="group relative grid min-w-0 place-items-center text-xs font-black text-white transition hover:brightness-110"
                style={{ flexGrow: Math.max(r.percent, 1.6), flexBasis: 0, background: RECIPE_COLORS[i] }}
              >
                {r.percent >= 2 && (
                  <span className="truncate px-0.5" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                    {el.symbol}
                    {r.percent >= 6 && <span className="ml-1 font-semibold opacity-90">{Math.round(r.percent)}%</span>}
                  </span>
                )}
              </button>
            );
          })}
          <div className="grid min-w-0 place-items-center bg-line text-[10px] font-bold text-muted" style={{ flexGrow: Math.max(rest, 2), flexBasis: 0 }} title="Everything else">
            …
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {top.filter((r) => r.percent < 2).map((r) => {
            const el = getElement(r.z)!;
            const i = top.indexOf(r);
            return (
              <button key={r.z} onClick={() => onSelect(r.z)} className="flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-bold hover:border-soil">
                <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: RECIPE_COLORS[i] }} />
                {el.symbol} {r.percent}%
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Just two elements, oxygen and silicon, make up over 80% of the solid part of soil. Remember that about half of
          soil&apos;s <em>volume</em> is air and water filling the pores (see{" "}
          <Link href="/soil/learn/what-is-soil" className="font-bold underline">What Is Soil?</Link>).
        </p>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">What each element does</div>
        <div className="flex flex-wrap gap-1.5">
          <RoleChip active={role === null} color="#6e5f50" onClick={() => onRole(null)}>
            All soil elements ({SOIL_ELEMENTS.length})
          </RoleChip>
          {(Object.keys(SOIL_ROLES) as SoilRole[]).map((r) => (
            <RoleChip key={r} active={role === r} color={SOIL_ROLES[r].color} onClick={() => onRole(role === r ? null : r)}>
              {SOIL_ROLES[r].icon} {SOIL_ROLES[r].label}
            </RoleChip>
          ))}
        </div>
        {role && (
          <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: `${SOIL_ROLES[role].color}18` }}>
            <p><strong>{SOIL_ROLES[role].label}:</strong> {SOIL_ROLES[role].blurb}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SOIL_ELEMENTS.filter((s) => s.roles.includes(role)).map((s) => {
                const el = getElement(s.z)!;
                return (
                  <button
                    key={s.z}
                    onClick={() => onSelect(s.z)}
                    className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold shadow-sm hover:-translate-y-0.5"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded text-[10px] font-black" style={{ background: CATEGORY_INFO[el.category].color }}>{el.symbol}</span>
                    {el.name}
                    {viewed.includes(s.z) && <span className="text-leaf">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RoleChip({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold transition ${active ? "text-white" : "bg-white"}`}
      style={{ borderColor: color, background: active ? color : undefined, color: active ? "white" : color }}
    >
      {children}
    </button>
  );
}
