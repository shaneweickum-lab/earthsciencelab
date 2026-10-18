import type { MultiWorld } from "@/world/multi";
import type { Message } from "./protocol";

/** Who's in a world right now. */
export interface Presence {
  pid: string;
  name: string;
  host: boolean;
}

/** How a world's farmers talk to each other, and where the host keeps the world's snapshot. */
export interface Transport {
  send(msg: Message): void;
  onMessage(cb: (msg: Message) => void): () => void;
  /** Announce yourself, and hear who else is here. */
  track(me: Presence): void;
  onPresence(cb: (here: Presence[]) => void): () => void;
  saveSnapshot(seq: number, world: MultiWorld): Promise<void>;
  loadSnapshot(): Promise<{ seq: number; world: MultiWorld } | null>;
  close(): void;
}

type Listeners<T> = Set<(v: T) => void>;
const emit = <T,>(ls: Listeners<T>, v: T) => ls.forEach((cb) => cb(v));

// ───────────────────────── in memory (tests) ─────────────────────────

/** Several transports in one process, as if on a network: messages arrive a moment later. */
export class MemoryHub {
  members = new Set<MemoryTransport>();
  snapshot: { seq: number; world: MultiWorld } | null = null;
  /** Drop messages, to test recovery. */
  dropping = false;

  connect(): MemoryTransport {
    const t = new MemoryTransport(this);
    this.members.add(t);
    return t;
  }

  presence() {
    return [...this.members].flatMap((m) => (m.me ? [m.me] : []));
  }

  announce() {
    const here = this.presence();
    for (const m of this.members) emit(m.presenceListeners, here);
  }
}

export class MemoryTransport implements Transport {
  me: Presence | null = null;
  listeners: Listeners<Message> = new Set();
  presenceListeners: Listeners<Presence[]> = new Set();
  constructor(private hub: MemoryHub) {}

  send(msg: Message) {
    if (this.hub.dropping) return;
    const copy = JSON.parse(JSON.stringify(msg)) as Message;
    for (const m of this.hub.members) if (m !== this) queueMicrotask(() => emit(m.listeners, copy));
  }

  onMessage(cb: (msg: Message) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  track(me: Presence) {
    this.me = me;
    queueMicrotask(() => this.hub.announce());
  }

  onPresence(cb: (here: Presence[]) => void) {
    this.presenceListeners.add(cb);
    return () => this.presenceListeners.delete(cb);
  }

  async saveSnapshot(seq: number, world: MultiWorld) {
    this.hub.snapshot = JSON.parse(JSON.stringify({ seq, world }));
  }

  async loadSnapshot() {
    return this.hub.snapshot ? JSON.parse(JSON.stringify(this.hub.snapshot)) : null;
  }

  close() {
    this.hub.members.delete(this);
    this.hub.announce();
  }
}

// ───────────────────────── between tabs (development, the smoke test) ─────────────────────────

const HEARTBEAT_MS = 1000;

/** Browser tabs on this computer, over a BroadcastChannel; the snapshot lives in localStorage. */
export class LocalTransport implements Transport {
  private ch: BroadcastChannel;
  private listeners: Listeners<Message> = new Set();
  private presenceListeners: Listeners<Presence[]> = new Set();
  private seen = new Map<string, { p: Presence; at: number }>();
  private me: Presence | null = null;
  private timer: ReturnType<typeof setInterval>;

  constructor(private worldId: string) {
    this.ch = new BroadcastChannel(`soil-mp:${worldId}`);
    this.ch.onmessage = (e) => {
      const d = e.data as { presence?: Presence; leave?: string; msg?: Message };
      if (d.presence) this.see(d.presence);
      if (d.leave) {
        this.seen.delete(d.leave);
        this.announce();
      }
      if (d.msg) emit(this.listeners, d.msg);
    };
    this.timer = setInterval(() => this.beat(), HEARTBEAT_MS);
  }

  private see(p: Presence) {
    const known = this.seen.has(p.pid);
    this.seen.set(p.pid, { p, at: Date.now() });
    if (!known) this.announce();
  }

  private beat() {
    if (this.me) this.ch.postMessage({ presence: this.me });
    const stale = [...this.seen.values()].filter((s) => s.p.pid !== this.me?.pid && Date.now() - s.at > HEARTBEAT_MS * 3.5);
    for (const s of stale) this.seen.delete(s.p.pid);
    if (stale.length) this.announce();
  }

  private announce() {
    emit(this.presenceListeners, [...this.seen.values()].map((s) => s.p));
  }

  send(msg: Message) {
    this.ch.postMessage({ msg });
  }

  onMessage(cb: (msg: Message) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  track(me: Presence) {
    this.me = me;
    this.see(me);
    this.ch.postMessage({ presence: me });
  }

  onPresence(cb: (here: Presence[]) => void) {
    this.presenceListeners.add(cb);
    return () => this.presenceListeners.delete(cb);
  }

  async saveSnapshot(seq: number, world: MultiWorld) {
    localStorage.setItem(`soil-mp:${this.worldId}`, JSON.stringify({ seq, world }));
  }

  async loadSnapshot() {
    const raw = localStorage.getItem(`soil-mp:${this.worldId}`);
    return raw ? JSON.parse(raw) : null;
  }

  close() {
    clearInterval(this.timer);
    if (this.me) this.ch.postMessage({ leave: this.me.pid });
    this.ch.close();
  }
}
