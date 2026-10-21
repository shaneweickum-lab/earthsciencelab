import { idx, inBounds } from "@/world/map";
import type { Tile } from "@/world/types";

/** How tall one mountain terrace is, in world units. */
export const STEP = 0.7;

/** The height of a tile's top: terraces stack up, and a trail ramp sits halfway between two. */
export const tileTop = (t: Tile | undefined) => (t ? ((t.elev ?? 0) - (t.ramp ? 0.5 : 0)) * STEP : 0);

/** The ground height under a point (for the player, townsfolk, and buildings). */
export function heightAt(tiles: Tile[], x: number, z: number): number {
  const tx = Math.round(x), tz = Math.round(z);
  return inBounds(tx, tz) ? tileTop(tiles[idx(tx, tz)]) : 0;
}
