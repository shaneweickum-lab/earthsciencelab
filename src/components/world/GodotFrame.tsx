"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HomesteadOverlay } from "@/components/homestead/HomesteadOverlay";
import { useProgress } from "@/store/progress";
import { loadWorld, saveWorld } from "@/world/engine";
import type { WorldState } from "@/world/types";
import { SAVE_KEY } from "./useWorld";

/**
 * Embeds the Godot web build (public/godot, made by `npm run godot:export`).
 * Protocol (godot/autoload/Site.gd): the game posts soil:ready, soil:recordFarm, and
 * soil:setGrade; this page answers with the reader's grade level, records farm badges, and
 * saves grade changes made in the game. soil:openHomestead (sent after the game saves) shows
 * My Homestead over the game; closing it posts soil:reload so the game picks up the changes.
 */
export function GodotFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const grade = useProgress((s) => s.gradeLevel);
  const [built, setBuilt] = useState<boolean | null>(null);
  const [home, setHome] = useState<WorldState | null>(null);
  const updateHome = useCallback((fn: (w: WorldState) => WorldState) => {
    setHome((w) => {
      if (!w) return w;
      const next = fn(w);
      try {
        localStorage.setItem(SAVE_KEY, saveWorld(next));
      } catch {
        // Storage can be full or blocked.
      }
      return next;
    });
  }, []);
  const closeHome = () => {
    setHome(null);
    frame.current?.contentWindow?.postMessage({ type: "soil:reload" }, location.origin);
    frame.current?.focus();
  };

  useEffect(() => {
    fetch("/godot/index.html", { method: "HEAD" }).then((r) => setBuilt(r.ok), () => setBuilt(false));
  }, []);

  useEffect(() => {
    const sendGrade = () => frame.current?.contentWindow?.postMessage({ type: "grade", level: useProgress.getState().gradeLevel }, location.origin);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "soil:ready") sendGrade();
      if (e.data?.type === "soil:setGrade" && ["elementary", "middle", "high"].includes(e.data.level)) {
        useProgress.getState().setGradeLevel(e.data.level);
      }
      if (e.data?.type === "soil:openHomestead") setHome(loadWorld(localStorage.getItem(SAVE_KEY)));
      if (e.data?.type === "soil:recordFarm") {
        const { journal, harvests, bestSoilHealth } = e.data;
        if (Array.isArray(journal) && typeof harvests === "number" && typeof bestSoilHealth === "number") {
          useProgress.getState().recordFarm({ journal: journal.map(String), harvests, bestSoilHealth });
        }
      }
    };
    // A farm downloaded from the cloud: restart the game so it loads the new save.
    const onReplaced = () => frame.current?.contentWindow?.location.reload();
    window.addEventListener("message", onMessage);
    window.addEventListener("earthsciencelab:save-replaced", onReplaced);
    sendGrade();
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("earthsciencelab:save-replaced", onReplaced);
    };
  }, [grade]);

  if (built === false) {
    return (
      <div className="card p-6 text-sm">
        The Godot build isn&apos;t here yet. Run <code>npm run godot:export</code> to build it into <code>public/godot</code>.
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-soil-dark shadow-lg">
      {built && (
        <iframe
          ref={frame}
          src="/godot/index.html"
          title="Soil & Sprout"
          className="absolute inset-0 h-full w-full"
          allow="fullscreen; autoplay; gamepad"
        />
      )}
      {home && <HomesteadOverlay world={home} update={updateHome} onClose={closeHome} />}
    </div>
  );
}
