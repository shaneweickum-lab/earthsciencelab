import { GlobeScreen } from "@/components/globe/GlobeScreen";

export const metadata = { title: "Soil Globe · Earth Science Lab" };

export default function GlobePage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky">Explore</p>
        <h1 className="font-display text-4xl font-black">Soil Globe</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Different climates, rocks, and living things build different soils. Spin the planet to find out what&apos;s underfoot around the world.
        </p>
      </header>
      <GlobeScreen />
    </div>
  );
}
