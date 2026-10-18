import { act, applyTool, buy, buyPlot, craft, enterMine, interact, pickUpBuilding, putInChest, sellNow, ship, sleep, swapSlots, takeAllFromChest, takeFromChest } from "./engine";
import { accept, claimLesson, skipTutorial, turnIn, type ActiveQuest } from "./quests";
import { giveGift, talk } from "./town";
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
  select: (s: WorldState, n: number): WorldState => ({ ...s, selected: n }),
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
  craft,
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
