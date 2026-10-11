"use client";

import Link from "next/link";
import { useState } from "react";
import { SOIL_ORDER_IDS, SOIL_ORDERS, type SoilOrderId } from "@/data/soilOrders";
import { SOIL_REGIONS } from "@/data/soilRegions";

export function SoilOrdersGrid() {
  const [sel, setSel] = useState<SoilOrderId>("mollisol");
  const o = SOIL_ORDERS[sel];
  const places = SOIL_REGIONS.filter((r) => r.order === sel);
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {SOIL_ORDER_IDS.map((id) => (
          <li key={id}>
            <button onClick={() => setSel(id)} aria-pressed={sel === id}
              className={`w-full rounded-xl border-2 p-2 text-center text-xs font-black text-white transition ${sel === id ? "border-ink scale-105" : "border-transparent"}`}
              style={{ background: SOIL_ORDERS[id].color, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              {SOIL_ORDERS[id].name}
            </button>
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-paper p-4">
        <h3 className="text-lg font-black">{o.name}: {o.nickname}</h3>
        <p className="mt-1 text-sm">{o.description}</p>
        <p className="mt-1 text-xs text-muted">{o.nameMeaning}</p>
        {places.length > 0 && (
          <p className="mt-2 text-sm"><strong>Find them at:</strong> {places.map((p) => `${p.name} (${p.place})`).join(", ")}</p>
        )}
        <Link href="/soil/globe" className="mt-2 inline-block text-sm font-bold text-sky underline">Explore them on the Soil Globe →</Link>
      </div>
    </div>
  );
}
