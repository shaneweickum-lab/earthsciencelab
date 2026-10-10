import { GameScreen } from "@/components/game/GameScreen";

export const metadata = { title: "Regenerate the Field · Earth Science Lab" };

export default function GamePage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-soil">Game</p>
        <h1 className="font-display text-4xl font-black">Regenerate the Field</h1>
      </header>
      <GameScreen />
    </div>
  );
}
