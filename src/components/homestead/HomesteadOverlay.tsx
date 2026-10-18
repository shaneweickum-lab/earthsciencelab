"use client";

import type { WorldState } from "@/world/types";
import { HomesteadEditor } from "./HomesteadEditor";

/** My Homestead opened from the farmhouse in either game, over the whole page. */
export function HomesteadOverlay({ world, update, onClose }: {
  world: WorldState;
  update: (fn: (w: WorldState) => WorldState) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-soil-dark/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="My Homestead">
      <div className="card mx-auto max-w-6xl p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🏡</span>
          <h2 className="font-display text-2xl font-black">My Homestead</h2>
          <button onClick={onClose} className="btn btn-primary ml-auto">Back to the farm</button>
        </div>
        <HomesteadEditor world={world} update={update} />
      </div>
    </div>
  );
}
