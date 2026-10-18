import {
  addPlayer, asPlayer, buyFromStall, enterGate, everyoneAsleep, helperBlock, leaveGarden, nightMulti, setAsleep, setPosition, stockStall,
  tickMulti, unstockStall, type MultiWorld,
} from "@/world/multi";
import { say } from "@/world/engine";
import { applyOp } from "@/world/ops";
import type { WorldState } from "@/world/types";

/**
 * Multiplayer runs in lockstep. The host puts every change in one numbered order (a farmer's
 * action, the clock moving on, a night passing) and broadcasts it; everyone applies the same
 * entries in the same order with the same deterministic engine, so every copy of the world
 * stays identical. Only these small entries cross the network, never the world itself (except
 * the snapshot a new arrival starts from).
 */

/** Multiplayer-only actions (the rest are the game's ordinary named ops in world/ops.ts). */
export type WorldOp =
  | { op: "gate"; args: [garden: number] }
  | { op: "leaveGarden"; args: [] }
  | { op: "stock"; args: [slot: number, qty: number, price: number] }
  | { op: "unstock"; args: [listing: number] }
  | { op: "buyStall"; args: [garden: number, listing: number, qty: number] }
  | { op: "bed"; args: [asleep: boolean] };

const WORLD_OPS = new Set(["gate", "leaveGarden", "stock", "unstock", "buyStall", "bed"]);

/** What a farmer asks the host to do. */
export interface Intent {
  pid: string;
  op: string;
  args: unknown[];
  /** Where they're standing when they do it (movement itself is local). */
  pos?: WorldState["player"];
}

export type Entry =
  | ({ kind: "op" } & Intent)
  | { kind: "tick"; minutes: number }
  | { kind: "night"; awake: string[] }
  | { kind: "join"; pid: string; name: string; avatar?: string };

/** Apply one entry. Everyone runs exactly this, in the host's order. */
export function applyEntry(m: MultiWorld, e: Entry): MultiWorld {
  switch (e.kind) {
    case "tick":
      return tickMulti(m, e.minutes).world;
    case "night":
      return nightMulti(m, e.awake);
    case "join":
      return addPlayer(m, e.pid, e.name, e.avatar) ?? m;
    case "op": {
      if (!m.players[e.pid]) return m;
      const at = e.pos ? setPosition(m, e.pid, e.pos) : m;
      if (WORLD_OPS.has(e.op)) return applyWorldOp(at, e.pid, e as unknown as WorldOp);
      // In someone else's garden, some things are the owner's alone.
      if (e.op === "act" || e.op === "applyTool" || e.op === "interact") {
        const why = helperBlock(at, e.pid, e.op === "interact" ? "interact" : "act");
        if (why) return asPlayer(at, e.pid, (v) => say(v, why));
      }
      if (["take", "takeAll", "put", "craft", "buyPlot", "pickUp", "sleep"].includes(e.op)) {
        const p = at.players[e.pid];
        if (p.area.kind === "garden" && p.area.garden !== p.garden) return asPlayer(at, e.pid, (v) => say(v, "That's not yours to use."));
        if (e.op === "sleep") return at; // in multiplayer, beds go through "bed"
      }
      return asPlayer(at, e.pid, (v) => applyOp(v, e.op, e.args));
    }
  }
}

function applyWorldOp(m: MultiWorld, pid: string, w: WorldOp): MultiWorld {
  const a = w.args as number[];
  switch (w.op) {
    case "gate": return enterGate(m, pid, Number(a[0]));
    case "leaveGarden": return leaveGarden(m, pid);
    case "stock": return stockStall(m, pid, Number(a[0]), Number(a[1]), Number(a[2]));
    case "unstock": return unstockStall(m, pid, Number(a[0]));
    case "buyStall": return buyFromStall(m, pid, Number(a[0]), Number(a[1]), Number(a[2]));
    case "bed": return setAsleep(m, pid, Boolean(w.args[0]));
  }
}

/** After an entry, should the night pass? (Only the host asks; it then sequences a "night".) */
export const nightDue = (m: MultiWorld, online: string[]) => everyoneAsleep(m, online);

/**
 * A cheap fingerprint of the world, so clients can notice if they've drifted from the host
 * (a missed message) and reload a snapshot.
 */
export function fingerprint(m: MultiWorld): string {
  let h = m.minute;
  const mix = (n: number) => (h = (Math.imul(h ^ n, 2654435761) >>> 0));
  for (const p of Object.values(m.players).sort((a, b) => a.garden - b.garden)) {
    mix(p.coins);
    mix(Math.round(p.energy * 10));
    for (const s of p.inventory) mix(s ? s.qty + s.item.length * 31 : 7);
  }
  for (const k of Object.keys(m.farms).sort()) {
    for (const t of m.farms[Number(k)].tiles) mix((t.tilled ? 1 : 0) + (t.crop ? Math.round(t.crop.growth * 1000) : 0) + Math.round(t.moisture));
  }
  return h.toString(36);
}

// ───────────────────────── messages ─────────────────────────

export type Message =
  /** A farmer's position, many times a second (not sequenced; only for drawing them). */
  | { t: "pos"; pid: string; pos: WorldState["player"]; area: string; anim?: string; at: number }
  /** A farmer asking the host to do something. */
  | { t: "intent"; intent: Intent }
  /** A newcomer asking to join (the host answers with a snapshot). */
  | { t: "hello"; pid: string; name: string; avatar?: string }
  /** The host's sequenced entries. */
  | { t: "entries"; from: number; entries: Entry[]; print?: string }
  /** A snapshot is ready at this sequence number (fetch it through the transport). */
  | { t: "snapshot"; seq: number; for?: string }
  /** All 8 gardens are taken. */
  | { t: "full"; for: string }
  /** The host is closing the world. */
  | { t: "bye" };
