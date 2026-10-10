"use client";

import { useEffect } from "react";
import { BADGES } from "@/store/badges";
import { useProgress } from "@/store/progress";

export function BadgeToast() {
  const toast = useProgress((s) => s.toasts[0]);
  const dismiss = useProgress((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;
  const badge = BADGES[toast];
  return (
    <div className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4" role="status" aria-live="polite">
      <button
        key={toast}
        onClick={dismiss}
        className="card animate-pop-in flex items-center gap-4 px-5 py-4 text-left"
      >
        <span className="text-4xl">{badge.icon}</span>
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-leaf">Badge unlocked!</span>
          <span className="block text-lg font-bold">{badge.name}</span>
          <span className="block text-sm text-muted">{badge.description}</span>
        </span>
      </button>
    </div>
  );
}
