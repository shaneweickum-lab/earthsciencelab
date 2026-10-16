import { GodotFrame } from "@/components/world/GodotFrame";

export const metadata = { title: "Soil & Sprout (Godot preview) · Earth Science Lab" };

export default function GodotPreviewPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-soil">Game · Preview</p>
          <h1 className="font-display text-4xl font-black">Soil &amp; Sprout in Godot</h1>
        </div>
        <p className="max-w-md text-sm text-muted">
          The game is moving to the Godot engine so it can also come to desktop. This preview grows as the port does. Your farm
          is shared with the <a className="underline" href="/soil/game">current game</a>.
        </p>
      </header>
      <GodotFrame />
    </div>
  );
}
