"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/store/progress";

/**
 * Embeds the Godot web build (public/godot, made by `npm run godot:export`).
 * Protocol (godot/autoload/Site.gd): the game posts soil:ready, soil:recordFarm, and
 * soil:setGrade; this page answers with the reader's grade level, records farm badges, and
 * saves grade changes made in the game.
 */
export function GodotFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const grade = useProgress((s) => s.gradeLevel);
  const [built, setBuilt] = useState<boolean | null>(null);

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
      if (e.data?.type === "soil:recordFarm") {
        const { journal, harvests, bestSoilHealth } = e.data;
        if (Array.isArray(journal) && typeof harvests === "number" && typeof bestSoilHealth === "number") {
          useProgress.getState().recordFarm({ journal: journal.map(String), harvests, bestSoilHealth });
        }
      }
    };
    window.addEventListener("message", onMessage);
    sendGrade();
    return () => window.removeEventListener("message", onMessage);
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
    </div>
  );
}
