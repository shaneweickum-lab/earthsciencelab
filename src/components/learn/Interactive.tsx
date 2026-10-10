"use client";

import dynamic from "next/dynamic";
import type { InteractiveType } from "@/content/soil/lessons";
import { ErosionSim } from "./ErosionSim";
import { HealthSort } from "./HealthSort";
import { PrinciplesCards } from "./PrinciplesCards";
import { SoilPie } from "./SoilPie";
import { TextureTriangle } from "./TextureTriangle";

const SoilProfile3D = dynamic(() => import("./SoilProfile3D"), {
  ssr: false,
  loading: () => <div className="grid h-[420px] place-items-center rounded-2xl bg-paper text-muted">Digging a soil pit…</div>,
});

export function Interactive({ type }: { type: InteractiveType }) {
  switch (type) {
    case "soil-pie": return <SoilPie />;
    case "texture-triangle": return <TextureTriangle />;
    case "soil-profile": return <SoilProfile3D />;
    case "health-sort": return <HealthSort />;
    case "erosion-sim": return <ErosionSim />;
    case "principles": return <PrinciplesCards />;
  }
}
