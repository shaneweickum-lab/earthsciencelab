"use client";

import { useState } from "react";
import { useMulti } from "@/net/mp";
import { gardenName, type Area, type MultiWorld } from "@/world/multi";

function where(m: MultiWorld, a: Area): string {
  if (a.kind === "town") return "in town";
  if (a.kind === "mine") return `in the mine, floor ${a.floor}`;
  return `in ${gardenName(m, a.garden)}`;
}

/** Top center in a shared world: the world, its code, who's here, and whose garden you're in. */
export function MultiHud() {
  const world = useMulti((s) => s.world);
  const me = useMulti((s) => s.me);
  const info = useMulti((s) => s.info);
  const session = useMulti((s) => s.session);
  useMulti((s) => s.version);
  const [open, setOpen] = useState(false);
  if (!world || !me || !info || !session) return null;
  const mine = world.players[me.pid];
  if (!mine) return null;
  const online = session.online.filter((p) => world.players[p.pid]);
  const visiting = mine.area.kind === "garden" && mine.area.garden !== mine.garden ? gardenName(world, mine.area.garden) : null;
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1">
      <button onClick={() => setOpen((o) => !o)} className="rounded-full bg-card/95 px-3 py-1 text-xs font-black shadow" aria-expanded={open} aria-label="Farmers in this world">
        👩‍🌾 {info.name} · {online.length} online {open ? "▴" : "▾"}
      </button>
      {visiting && <div className="rounded-full bg-leaf px-3 py-1 text-xs font-black text-white shadow">Visiting {visiting}</div>}
      {open && (
        <div className="w-64 rounded-2xl bg-card/95 p-3 text-xs shadow-lg">
          {info.hostId === me.pid && (
            <p className="mb-2">
              Friends join with the code <b className="font-mono text-sm">{info.code}</b>
            </p>
          )}
          <ul className="space-y-1">
            {Object.values(world.players).sort((a, b) => a.garden - b.garden).map((p) => {
              const here = online.some((o) => o.pid === p.id);
              return (
                <li key={p.id} className={here ? "" : "opacity-50"}>
                  <b>{p.name}</b>{p.id === info.hostId ? " (host)" : ""}{p.id === me.pid ? " (you)" : ""}
                  <span className="block text-muted">{here ? `${where(world, p.area)}${p.asleep ? " · asleep" : ""}` : "not playing right now"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
