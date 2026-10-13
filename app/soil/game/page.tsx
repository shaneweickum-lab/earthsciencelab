import { WorldScreen } from "@/components/world/WorldScreen";

export const metadata = { title: "Soil & Sprout · Earth Science Lab" };

export default function GamePage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-soil">Game</p>
          <h1 className="font-display text-4xl font-black">Soil &amp; Sprout</h1>
        </div>
        <p className="max-w-md text-sm text-muted">
          Grow a garden, care for the soil, watch the weather, and meet the creatures that share your farm.
        </p>
      </header>
      <WorldScreen />
    </div>
  );
}
