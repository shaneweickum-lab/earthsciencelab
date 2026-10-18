import { describe, expect, it } from "vitest";
import { PLOTS } from "@/world/map";
import { newMultiWorld, viewFor } from "@/world/multi";
import { fingerprint } from "./protocol";
import { ClientSession, HostSession } from "./session";
import { MemoryHub } from "./transport";

/** Let queued messages and snapshot loads finish. */
const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};

async function setup() {
  const hub = new MemoryHub();
  const world = newMultiWorld("w", "Test", 99, undefined, { id: "ana", name: "Ana" });
  const host = new HostSession(hub.connect(), { pid: "ana", name: "Ana", host: true }, world);
  host.start();
  const ben = new ClientSession(hub.connect(), { pid: "ben", name: "Ben", host: false });
  ben.start();
  await settle();
  ben.hello();
  await settle();
  host.flush();
  await settle();
  return { hub, host, ben };
}

describe("multiplayer sessions", () => {
  it("let a farmer join from a snapshot and get their own garden", async () => {
    const { host, ben } = await setup();
    expect(ben.loaded).toBe(true);
    expect(Object.keys(host.world.players)).toEqual(["ana", "ben"]);
    expect(ben.world.players.ben.garden).toBe(1);
    expect(fingerprint(ben.world)).toBe(fingerprint(host.world));
    expect(host.online.map((p) => p.pid).sort()).toEqual(["ana", "ben"]);
  });

  it("keep everyone's copy the same as they play", async () => {
    const { host, ben } = await setup();
    // Both take Grandma's scythe, the clock runs, and Ben walks over to Ana's garden.
    host.submit({ op: "takeAll", args: ["chest"], pos: { x: 7, y: 10, facing: "up" } });
    ben.submit({ op: "takeAll", args: ["chest"], pos: { x: 7, y: 10, facing: "up" } });
    for (let i = 0; i < 5; i++) host.tick(30);
    ben.submit({ op: "leaveGarden", args: [] });
    await settle();
    ben.submit({ op: "gate", args: [0] });
    await settle();
    host.flush();
    await settle();
    expect(host.world.players.ben.area).toEqual({ kind: "garden", garden: 0 });
    expect(ben.world.players.ben.inventory.some((s) => s?.item === "scythe")).toBe(true);
    expect(ben.seq).toBe(host.seq);
    expect(JSON.stringify(ben.world)).toBe(JSON.stringify(host.world));
    // Ben's view is Ana's garden.
    const p = PLOTS[0];
    expect(viewFor(ben.world, "ben").tiles[p.y0 * 76 + p.x0]).toEqual(host.world.farms[0].tiles[p.y0 * 38 + p.x0]);
  });

  it("pass the night once everyone online is in bed", async () => {
    const { host, ben } = await setup();
    const day = host.world.minute;
    host.submit({ op: "bed", args: [true] });
    host.flush();
    await settle();
    expect(host.world.minute).toBe(day); // Ben's still up
    ben.submit({ op: "bed", args: [true] });
    await settle();
    host.flush();
    await settle();
    expect(host.world.minute).toBeGreaterThan(day);
    expect(ben.world.minute).toBe(host.world.minute);
    expect(Object.values(ben.world.players).every((p) => !p.asleep)).toBe(true);
  });

  it("catch up from a fresh snapshot after missing messages", async () => {
    const { hub, host, ben } = await setup();
    hub.dropping = true;
    host.tick(60);
    host.flush();
    await settle();
    hub.dropping = false;
    host.tick(60);
    host.flush();
    await settle();
    // Ben noticed the gap, asked again, and is back in step.
    host.flush();
    await settle();
    expect(ben.seq).toBe(host.seq);
    expect(fingerprint(ben.world)).toBe(fingerprint(host.world));
  });

  it("turn away a ninth farmer", async () => {
    const { hub, host } = await setup();
    const extra = [];
    for (let i = 0; i < 7; i++) {
      const c = new ClientSession(hub.connect(), { pid: `p${i}`, name: `P${i}`, host: false });
      c.start();
      await settle();
      c.hello();
      await settle();
      extra.push(c);
    }
    expect(Object.keys(host.world.players)).toHaveLength(8);
    expect(extra[6].stopped).toBe("full");
    expect(extra[5].loaded).toBe(true);
  });

  it("tell everyone when the host leaves", async () => {
    const { host, ben } = await setup();
    host.close();
    await settle();
    expect(ben.stopped).toBe("hostLeft");
  });
});
