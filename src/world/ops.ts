import {
  HOTBAR_SIZE, act, applyTool, buy, buyPlot, craft, eat, enterGate, enterMine, interact, leaveFarm, pickUpBuilding, putInChest, rotateBuilding, sellNow, ship, sleep,
  playerTile, stockStall, swapSlots, takeAllFromChest, takeFromChest, travel, turnPlacing, unstockStall,
} from "./engine";
import { DESTINATIONS } from "./map";
import { accept, claimLesson, skipTutorial, turnIn, type ActiveQuest } from "./quests";
import { giveGift, route, talk } from "./town";
import type { WorldState } from "./types";

/**
 * Everything the player can do to the world, by name, with plain arguments. The game calls these
 * through `run(op, ...args)`: in single-player they're applied right away; in multiplayer the
 * name and arguments go to the host, which applies them to that farmer's view of the world.
 */
export const OPS = {
  act,
  applyTool,
  interact,
  select: (s: WorldState, n: number): WorldState => (Number.isInteger(n) && n >= 0 && n < HOTBAR_SIZE ? { ...s, selected: n } : s),
  swap: swapSlots,
  buy: (s: WorldState, id: string, qty = 1) => buy(s, id, qty),
  sellNow,
  ship,
  pickUp: pickUpBuilding,
  take: takeFromChest,
  takeAll: takeAllFromChest,
  put: putInChest,
  enterMine,
  buyPlot,
  craft: (s: WorldState, id: string, at?: string) => craft(s, id, at),
  eat,
  turnPlacing,
  rotate: rotateBuilding,
  // Garden Lane and the market stall. (In multiplayer the host handles these with its own rules.)
  gate: enterGate,
  leaveGarden: leaveFarm,
  stock: stockStall,
  unstock: unstockStall,
  // From a signpost: the walk there passes in a few minutes.
  travel: (s: WorldState, id: string) => {
    const d = DESTINATIONS.find((x) => x.id === id);
    const p = playerTile(s);
    return d ? travel(s, id, route(s, [p.x, p.y], [d.x, d.y]).length) : s;
  },
  sleep,
  avatar: (s: WorldState, avatar: string): WorldState => ({ ...s, avatar }),
  introSeen: (s: WorldState): WorldState => ({ ...s, introSeen: true }),
  talk: (s: WorldState, id: string) => talk(s, id).state,
  gift: (s: WorldState, id: string) => giveGift(s, id).state,
  accept: (s: WorldState, id: string, board?: ActiveQuest["board"]) => accept(s, id, board),
  turnIn: (s: WorldState, id: string) => turnIn(s, id).state,
  claimLesson,
  skipTutorial,
} satisfies Record<string, (s: WorldState, ...args: never[]) => WorldState>;

export type OpName = keyof typeof OPS;
type Rest<F> = F extends (s: WorldState, ...args: infer A) => WorldState ? A : never;
export type OpArgs<K extends OpName> = Rest<(typeof OPS)[K]>;

/** Apply a named op (unknown names and bad arguments leave the world as it is). */
export function applyOp(s: WorldState, op: string, args: unknown[]): WorldState {
  const fn = (OPS as Record<string, (s: WorldState, ...a: unknown[]) => WorldState>)[op];
  if (!fn) return s;
  try {
    return fn(s, ...args);
  } catch {
    return s;
  }
}
