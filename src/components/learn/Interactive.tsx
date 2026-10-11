"use client";

import dynamic from "next/dynamic";
import type { InteractiveType, Level } from "@/content/soil/curriculum/types";
import { ColorChart } from "./ColorChart";
import { CycleDiagram } from "./CycleDiagram";
import { ErosionSim } from "./ErosionSim";
import { FoodWeb } from "./FoodWeb";
import { FormationTimeline } from "./FormationTimeline";
import { HealthSort } from "./HealthSort";
import { PhScale } from "./PhScale";
import { PrinciplesCards } from "./PrinciplesCards";
import { SoilOrdersGrid } from "./SoilOrdersGrid";
import { SoilPie } from "./SoilPie";
import { TextureTriangle } from "./TextureTriangle";

const SoilProfile3D = dynamic(() => import("./SoilProfile3D"), {
  ssr: false,
  loading: () => <div className="grid h-[420px] place-items-center rounded-2xl bg-paper text-muted">Digging a soil pit…</div>,
});

export function Interactive({ type, level }: { type: InteractiveType; level: Level }) {
  switch (type) {
    case "soil-pie": return <SoilPie />;
    case "texture-triangle": return <TextureTriangle />;
    case "soil-profile": return <SoilProfile3D />;
    case "health-sort": return <HealthSort />;
    case "erosion-sim": return <ErosionSim />;
    case "principles": return <PrinciplesCards />;
    case "formation-timeline": return <FormationTimeline />;
    case "food-web": return <FoodWeb />;
    case "carbon-cycle": return <CycleDiagram kind="carbon" level={level} />;
    case "nitrogen-cycle": return <CycleDiagram kind="nitrogen" level={level} />;
    case "ph-scale": return <PhScale />;
    case "color-chart": return <ColorChart />;
    case "soil-orders": return <SoilOrdersGrid />;
  }
}
