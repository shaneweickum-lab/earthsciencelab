import { atGardenExit } from "@/world/multi";
import { runtime, useWorld } from "@/components/world/useWorld";
import { areaKey, useMulti } from "./mp";

/** How often your position goes out to the others while you move. */
const POS_MS = 150;

let posAt = 0;
let lastSent = "";
let leaving = false;

/**
 * The multiplayer part of each frame: sending your position, and leaving a garden by its road.
 * (The host's clock runs on its own timer; see HostSession.startClock.) Returns false when this
 * isn't a multiplayer game.
 */
export function multiplayerFrame(): boolean {
  const { session, world, me } = useMulti.getState();
  if (!session || !world || !me) return false;
  const p = world.players[me.pid];
  if (!p) return true;


  const now = performance.now();
  const pos = runtime.player;
  const key = `${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.facing},${areaKey(p.area)}`;
  if (key !== lastSent && now - posAt > POS_MS) {
    posAt = now;
    lastSent = key;
    session.sendPosition({ ...pos }, areaKey(p.area), runtime.moving ? "walk" : "idle");
  }

  // The end of a garden's road leads back to its gate on Garden Lane.
  if (p.area.kind === "garden" && atGardenExit(pos)) {
    if (!leaving) {
      leaving = true;
      useWorld.getState().remote?.("leaveGarden", []);
    }
  } else leaving = false;
  return true;
}
