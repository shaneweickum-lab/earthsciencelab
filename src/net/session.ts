import { DAY_END, timeOfDay } from "@/world/clock";
import { MAX_PLAYERS, type MultiWorld } from "@/world/multi";
import { applyEntry, fingerprint, nightDue, type Entry, type Intent, type Message } from "./protocol";
import type { Presence, Transport } from "./transport";

/** How often the host lets the clients check they still match it (in entries). */
const PRINT_EVERY = 40;
/** How long the host batches entries before sending them. */
const FLUSH_MS = 40;

type Listener = (world: MultiWorld) => void;

/** What both ends share: the world copy, who's online, and others' positions for drawing them. */
abstract class Session {
  world: MultiWorld;
  seq: number;
  online: Presence[] = [];
  positions = new Map<string, Extract<Message, { t: "pos" }>>();
  protected listeners = new Set<Listener>();
  protected off: (() => void)[] = [];

  constructor(protected transport: Transport, readonly me: Presence, world: MultiWorld, seq: number) {
    this.world = world;
    this.seq = seq;
    this.off.push(transport.onMessage((m) => this.receive(m)));
    this.off.push(transport.onPresence((here) => this.presence(here)));
  }

  /** Start announcing yourself (after construction, so subclasses are ready for presence). */
  start() {
    this.transport.track(this.me);
  }

  onChange(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  protected changed() {
    this.listeners.forEach((cb) => cb(this.world));
  }

  protected presence(here: Presence[]) {
    this.online = here;
    for (const id of [...this.positions.keys()]) if (!here.some((p) => p.pid === id)) this.positions.delete(id);
    this.changed();
  }

  /** Tell the others where you are (they only draw it; your actions carry their own position). */
  sendPosition(pos: Extract<Message, { t: "pos" }>["pos"], area: string, anim?: string) {
    this.transport.send({ t: "pos", pid: this.me.pid, pos, area, anim, at: Date.now() });
  }

  protected receive(m: Message) {
    if (m.t === "pos" && m.pid !== this.me.pid) {
      this.positions.set(m.pid, m);
      this.changed();
    }
  }

  abstract submit(intent: Omit<Intent, "pid">): void;

  close() {
    this.off.forEach((f) => f());
    this.transport.close();
  }
}

/** The host: puts everything in order, applies it, and passes it on. */
export class HostSession extends Session {
  private pending: Entry[] = [];
  private pendingFrom = 0;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(transport: Transport, me: Presence, world: MultiWorld, seq = 0) {
    super(transport, me, world, seq);
  }

  private sequence(e: Entry) {
    if (!this.pending.length) this.pendingFrom = this.seq + 1;
    this.seq++;
    this.world = applyEntry(this.world, e);
    this.pending.push(e);
    if (!this.flushTimer) this.flushTimer = setTimeout(() => this.flush(), FLUSH_MS);
    this.changed();
  }

  flush() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
    if (!this.pending.length) return;
    const print = Math.floor((this.pendingFrom - 1) / PRINT_EVERY) !== Math.floor(this.seq / PRINT_EVERY) ? fingerprint(this.world) : undefined;
    this.transport.send({ t: "entries", from: this.pendingFrom, entries: this.pending, print });
    this.pending = [];
  }

  private onlineIds() {
    return this.online.filter((p) => this.world.players[p.pid]).map((p) => p.pid);
  }

  /** After anything that might put the last farmer to bed, pass the night. */
  private checkNight() {
    if (nightDue(this.world, this.onlineIds())) this.sequence({ kind: "night", awake: [] });
  }

  submit(intent: Omit<Intent, "pid">) {
    this.act({ ...intent, pid: this.me.pid });
  }

  private act(intent: Intent) {
    this.sequence({ kind: "op", ...intent });
    if (intent.op === "bed") this.checkNight();
  }

  /** The clock moves on (the host's game loop calls this). At 2 AM, the night comes for everyone. */
  tick(minutes: number) {
    this.sequence({ kind: "tick", minutes });
    if (timeOfDay(this.world.minute) >= DAY_END) {
      const awake = this.onlineIds().filter((id) => !this.world.players[id].asleep);
      this.sequence({ kind: "night", awake });
      void this.save();
    }
  }

  private clock: ReturnType<typeof setInterval> | null = null;

  /**
   * Run the world's clock from the wall clock, so it keeps going (catching up in steps) when the
   * host's tab is in the background and the browser slows its timers.
   */
  startClock(msPerMinute: () => number) {
    let last = Date.now();
    let carry = 0;
    this.clock = setInterval(() => {
      const now = Date.now();
      // A laptop waking from sleep shouldn't fast-forward the world by hours.
      carry += Math.min(now - last, 60_000);
      last = now;
      const ms = msPerMinute();
      const minutes = Math.floor(carry / ms);
      if (minutes > 0) {
        carry -= minutes * ms;
        this.tick(minutes);
      }
    }, 250);
  }

  async save() {
    this.flush();
    await this.transport.saveSnapshot(this.seq, this.world);
  }

  protected presence(here: Presence[]) {
    super.presence(here);
    // Someone left while everyone else was in bed.
    this.checkNight();
  }

  protected async receive(m: Message) {
    super.receive(m);
    if (m.t === "intent" && this.world.players[m.intent.pid]) this.act(m.intent);
    if (m.t === "hello") {
      if (!this.world.players[m.pid]) {
        if (Object.keys(this.world.players).length >= MAX_PLAYERS) {
          this.transport.send({ t: "full", for: m.pid });
          return;
        }
        this.sequence({ kind: "join", pid: m.pid, name: m.name, avatar: m.avatar });
      }
      await this.save();
      this.transport.send({ t: "snapshot", seq: this.seq, for: m.pid });
    }
  }

  close() {
    if (this.clock) clearInterval(this.clock);
    this.flush();
    this.transport.send({ t: "bye" });
    super.close();
  }
}

/** Everyone else: asks the host to do things, and applies what the host sends back, in order. */
export class ClientSession extends Session {
  private buffer: Extract<Message, { t: "entries" }>[] = [];
  private ready = false;
  private loading = false;
  /** The world is full, or the host has gone: why we're not playing. */
  stopped: "full" | "hostLeft" | null = null;

  constructor(transport: Transport, me: Presence, private avatar?: string) {
    super(transport, me, null as unknown as MultiWorld, 0);
  }

  get loaded() {
    return this.ready;
  }

  /** Ask the host for a snapshot to start from. */
  hello() {
    this.ready = false;
    this.transport.send({ t: "hello", pid: this.me.pid, name: this.me.name, avatar: this.avatar });
  }

  submit(intent: Omit<Intent, "pid">) {
    if (this.ready) this.transport.send({ t: "intent", intent: { ...intent, pid: this.me.pid } });
  }

  protected async receive(m: Message) {
    super.receive(m);
    if (m.t === "entries") {
      if (!this.ready) this.buffer.push(m);
      else this.apply(m);
    }
    if (m.t === "snapshot" && (m.for === this.me.pid || !this.ready) && !this.loading) await this.load();
    if (m.t === "full" && m.for === this.me.pid) {
      this.stopped = "full";
      this.changed();
    }
    if (m.t === "bye") {
      this.stopped = "hostLeft";
      this.changed();
    }
  }

  private async load() {
    this.loading = true;
    const snap = await this.transport.loadSnapshot();
    this.loading = false;
    if (!snap) return;
    this.world = snap.world;
    this.seq = snap.seq;
    this.ready = true;
    const waiting = this.buffer;
    this.buffer = [];
    for (const b of waiting) this.apply(b);
    this.changed();
  }

  private apply(m: Extract<Message, { t: "entries" }>) {
    if (m.from + m.entries.length - 1 <= this.seq) return; // already have these
    if (m.from > this.seq + 1) {
      // Missed some: start again from a fresh snapshot.
      this.hello();
      return;
    }
    for (let i = this.seq + 1 - m.from; i < m.entries.length; i++) {
      this.world = applyEntry(this.world, m.entries[i]);
      this.seq++;
    }
    if (m.print && m.print !== fingerprint(this.world)) {
      this.hello();
      return;
    }
    this.changed();
  }
}
