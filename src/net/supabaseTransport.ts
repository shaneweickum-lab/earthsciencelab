import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { MultiWorld } from "@/world/multi";
import type { Message } from "./protocol";
import type { Presence, Transport } from "./transport";

/**
 * A world's farmers over Supabase Realtime: a private channel per world (only its members may
 * use it; see supabase/schema.sql), broadcast for messages, presence for who's online. The
 * host keeps the world's snapshot in the `worlds` table.
 */
export class SupabaseTransport implements Transport {
  private channel: RealtimeChannel;
  private listeners = new Set<(m: Message) => void>();
  private presenceListeners = new Set<(here: Presence[]) => void>();
  private me: Presence | null = null;
  private subscribed = false;
  private queue: Message[] = [];

  constructor(private db: SupabaseClient, private worldId: string, pid: string) {
    this.channel = db.channel(`world:${worldId}`, { config: { private: true, broadcast: { self: false }, presence: { key: pid } } });
    this.channel
      .on("broadcast", { event: "m" }, ({ payload }) => this.listeners.forEach((cb) => cb(payload as Message)))
      .on("presence", { event: "sync" }, () => {
        const here = Object.values(this.channel.presenceState<Presence>()).flatMap((list) => (list[0] ? [{ pid: list[0].pid, name: list[0].name, host: list[0].host }] : []));
        this.presenceListeners.forEach((cb) => cb(here));
      });
    void db.realtime.setAuth().then(() =>
      this.channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        this.subscribed = true;
        if (this.me) await this.channel.track(this.me);
        for (const m of this.queue.splice(0)) this.send(m);
      }),
    );
  }

  send(msg: Message) {
    if (!this.subscribed) {
      this.queue.push(msg);
      return;
    }
    void this.channel.send({ type: "broadcast", event: "m", payload: msg });
  }

  onMessage(cb: (msg: Message) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  track(me: Presence) {
    this.me = me;
    if (this.subscribed) void this.channel.track(me);
  }

  onPresence(cb: (here: Presence[]) => void) {
    this.presenceListeners.add(cb);
    return () => this.presenceListeners.delete(cb);
  }

  async saveSnapshot(seq: number, world: MultiWorld) {
    const { error } = await this.db.from("worlds").update({ data: world, seq, updated_at: new Date().toISOString() }).eq("id", this.worldId);
    if (error) throw error;
  }

  async loadSnapshot() {
    const { data, error } = await this.db.from("worlds").select("data, seq").eq("id", this.worldId).single();
    if (error || !data?.data) return null;
    return { seq: data.seq as number, world: data.data as MultiWorld };
  }

  close() {
    void this.db.removeChannel(this.channel);
  }
}
