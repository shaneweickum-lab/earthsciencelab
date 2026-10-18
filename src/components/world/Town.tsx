"use client";

import { useState } from "react";
import { ITEMS } from "@/world/items";
import { accept, boardRequests, goalLabel, offers, QUEST_BY_ID, questState, questStatus, rewardText, turnIn, type ActiveQuest } from "@/world/quests";
import { canGift, friendship, giftReaction, giveGift, hearts, MAX_HEARTS, NPC_BY_ID, npcPose } from "@/world/town";
import type { WorldState } from "@/world/types";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

export function Hearts({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-px text-sm" aria-label={`${value} of ${MAX_HEARTS} hearts`} title={`Friendship: ${value} of ${MAX_HEARTS} hearts`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <span key={i} aria-hidden className={i < value ? "" : "opacity-25 grayscale"}>❤️</span>
      ))}
    </span>
  );
}

/** Talking with a townsperson: today's chat, a gift, and anything special they offer. */
export function NpcDialog() {
  const id = useWorld((s) => s.talkingTo)!;
  const w = useWorld((s) => s.world!);
  const { update, close, open } = useWorld.getState();
  const npc = NPC_BY_ID[id];
  const [text, setText] = useState(useWorld.getState().npcLine);
  const pose = npcPose(w, npc, w.minute);
  const slot = w.inventory[w.selected];
  const giftable = slot && canGift(slot.item);
  const giftedToday = friendship(w, id).gifted === Math.floor((w.minute - 360) / 1440) + 1;
  const give = () => {
    const r = giveGift(useWorld.getState().world!, id);
    setText(r.text);
    update(() => r.state);
  };
  return (
    <Modal title={npc.name} icon="💬" onClose={close}>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/icons/avatar_${npc.avatar}.png`} alt="" className="h-24 w-24 shrink-0 rounded-2xl bg-paper object-contain p-1" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{npc.role}</p>
          <Hearts value={hearts(w, id)} />
          <p className="text-xs text-muted">Right now: {pose.doing}</p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-paper p-4 text-lg leading-relaxed" aria-live="polite">“{text}”</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {giftable && (
          <button className="btn btn-primary py-1.5" onClick={give} disabled={giftedToday}>
            🎁 Give <ItemIcon id={slot.item} grade={slot.grade} /> {ITEMS[slot.item].name}
            {giftedToday ? " (tomorrow)" : ""}
          </button>
        )}
        {npc.id === "mei" && <button className="btn btn-soil py-1.5" onClick={() => open("store")}>🛒 Shop</button>}
        <button className="btn btn-ghost py-1.5" onClick={close}>👋 Bye</button>
      </div>
      <NpcQuests npcId={id} onSay={setText} />
      {!giftable && <p className="mt-2 text-xs text-muted">Tip: hold an item in your hotbar to give it as a gift. Everyone has favorites!</p>}
      {giftable && !giftedToday && (
        <p className="mt-2 text-xs text-muted">{reactionHint(giftReaction(npc, slot.item), hearts(w, id))}</p>
      )}
    </Modal>
  );
}

/** A small hint once you know someone well enough. */
function reactionHint(r: ReturnType<typeof giftReaction>, h: number) {
  if (h < 2) return "One gift a day. Get to know them to learn what they love.";
  return { love: "💖 They'll love this!", like: "😊 They'll like this.", neutral: "🙂 They won't mind it.", dislike: "😬 Hmm, maybe not this." }[r];
}

/** Requests this person has for you, and ones you can hand in. */
function NpcQuests({ npcId, onSay }: { npcId: string; onSay: (text: string) => void }) {
  const w = useWorld((s) => s.world!);
  const update = useWorld((s) => s.update);
  const qs = questState(w);
  const offered = offers(w, npcId);
  const mine = qs.active.filter((a) => questStatus(w, a).giver === npcId);
  if (!offered.length && !mine.length) return null;
  return (
    <div className="mt-4 space-y-2">
      {mine.map((a) => {
        const st = questStatus(w, a);
        return (
          <div key={a.id} className="rounded-xl border border-line p-3 text-sm">
            <p className="font-black">📜 {st.title}</p>
            <QuestStep w={w} a={a} />
            {st.progress.done && (
              <button
                className="btn btn-primary mt-2 py-1 text-sm"
                onClick={() => {
                  const r = turnIn(useWorld.getState().world!, a.id);
                  onSay(r.text);
                  update(() => r.state);
                }}
              >
                ✅ {st.step.goal.kind === "deliver" ? "Hand over" : "Done!"}{st.last ? ` · ${rewardText(st.reward)}` : ""}
              </button>
            )}
          </div>
        );
      })}
      {offered.slice(0, 1).map((q) => (
        <div key={q.id} className="rounded-xl border-2 border-sun bg-sun/10 p-3 text-sm">
          <p className="font-black">{q.project ? "🏡 Community project" : "📜 New request"}: {q.title}</p>
          <p className="mt-1">“{q.ask}”</p>
          <p className="mt-1 text-xs font-bold text-muted">Reward: {rewardText(q.reward)}</p>
          <button
            className="btn btn-soil mt-2 py-1 text-sm"
            onClick={() => {
              onSay("Wonderful, thank you! Come find me when it's done.");
              update((s) => accept(s, q.id));
            }}
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  );
}

function QuestStep({ w, a }: { w: WorldState; a: ActiveQuest }) {
  const st = questStatus(w, a);
  return (
    <div className="mt-1">
      <p className="text-xs">
        {st.steps.length > 1 && <b>Step {st.stepIndex + 1} of {st.steps.length}: </b>}
        {st.step.label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className={`h-full ${st.progress.done ? "bg-leaf" : "bg-sun"}`} style={{ width: `${(st.progress.have / st.progress.need) * 100}%` }} />
        </div>
        <span className="text-[11px] font-black tabular-nums">{st.progress.have}/{st.progress.need}</span>
      </div>
    </div>
  );
}

/** The town notice board: today's delivery requests and the community project. */
export function NoticeBoard() {
  const w = useWorld((s) => s.world!);
  const { update, close } = useWorld.getState();
  const [said, setSaid] = useState("");
  const qs = questState(w);
  const requests = boardRequests(w);
  const project = QUEST_BY_ID["community-garden"];
  const projectActive = qs.active.find((a) => a.id === project.id);
  const projectDone = qs.done.includes(project.id);
  return (
    <Modal title="Town notice board" icon="📌" onClose={close}>
      <p className="mb-3 text-sm text-muted">Requests from your neighbors. Fill them here before they come down (3 days).</p>
      <div className="space-y-2">
        {requests.map((r) => {
          const active = qs.active.find((a) => a.id === r.id);
          const done = qs.done.includes(r.id);
          return (
            <div key={r.id} className="rounded-xl border border-line bg-[#fdf6e3] p-3 text-sm">
              <p className="font-black">📄 {r.board.title}</p>
              {!active && <p className="text-xs">{goalLabel(r.board.goal)}</p>}
              <p className="text-xs font-bold text-muted">Pays: {rewardText(r.board.reward)} (with {NPC_BY_ID[r.board.npc].short})</p>
              {done ? (
                <p className="mt-1 text-xs font-black text-leaf">✅ Filled. Thank you!</p>
              ) : active ? (
                <>
                  <QuestStep w={w} a={active} />
                  {questStatus(w, active).progress.done && (
                    <button
                      className="btn btn-primary mt-2 py-1 text-sm"
                      onClick={() => {
                        const res = turnIn(useWorld.getState().world!, r.id);
                        setSaid(res.text);
                        update(() => res.state);
                      }}
                    >
                      ✅ Deliver
                    </button>
                  )}
                </>
              ) : (
                <button className="btn btn-soil mt-2 py-1 text-sm" onClick={() => update((s) => accept(s, r.id, r.board))}>Take this request</button>
              )}
            </div>
          );
        })}
        <div className="rounded-xl border-2 border-leaf/50 bg-leaf-light/50 p-3 text-sm">
          <p className="font-black">🏡 Community project: {project.title}</p>
          {projectDone ? (
            <p className="text-xs">Finished! The community garden is thriving, and you can farm there too.</p>
          ) : projectActive ? (
            <QuestStep w={w} a={projectActive} />
          ) : (
            <p className="text-xs">Talk to Dr. Okafor at the Extension Office to help{qs.done.includes("soil-check") ? "." : " (she'll ask after you've tested your soil)."}</p>
          )}
        </div>
      </div>
      {said && <p className="mt-3 rounded-xl bg-paper p-3 text-sm">{said}</p>}
    </Modal>
  );
}

/** Everything you're working on. */
export function QuestLog() {
  const w = useWorld((s) => s.world!);
  const close = useWorld((s) => s.close);
  const qs = questState(w);
  return (
    <Modal title="Quests" icon="📜" onClose={close}>
      {qs.active.length === 0 ? (
        <p className="text-sm text-muted">No quests yet. Visit town, talk to people, and check the notice board in the square.</p>
      ) : (
        <ul className="space-y-2">
          {qs.active.map((a) => {
            const st = questStatus(w, a);
            const who = a.board ? "Notice board" : st.giver === "rosa" ? "Grandma Rosa's note" : NPC_BY_ID[st.giver].short;
            return (
              <li key={a.id} className="rounded-xl border border-line p-3 text-sm">
                <p className="font-black">{st.title} <span className="font-normal text-muted">· {who}</span></p>
                <QuestStep w={w} a={a} />
                {st.progress.done && <p className="mt-1 text-xs font-black text-leaf">{st.giver === "rosa" ? "Ready! Claim it on Grandma's note." : `Ready! Go see ${who === "Notice board" ? "the notice board" : who}.`}</p>}
                <p className="mt-1 text-[11px] text-muted">Reward: {rewardText(st.reward)}</p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Finished: {qs.done.filter((id) => !id.startsWith("board-") && !id.startsWith("lesson-")).length} story quests, {qs.done.filter((id) => id.startsWith("board-")).length} notice-board requests.</p>
    </Modal>
  );
}
