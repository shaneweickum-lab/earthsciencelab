"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useElementsPanel } from "@/store/elementsPanel";
import { ElementsExplorer } from "./ElementsExplorer";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Full-screen periodic table that opens over any page, so students keep their place. */
export function ElementsOverlay() {
  const { isOpen, z, open, close } = useElementsPanel();
  const path = usePathname();
  const onElementsPage = path === "/elements";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && useElementsPanel.getState().isOpen) close();
      if ((e.key === "e" || e.key === "E") && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target) && !onElementsPage) {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, onElementsPage]);

  useEffect(() => {
    if (onElementsPage) close();
  }, [onElementsPage, close]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || onElementsPage) return null;
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper" role="dialog" aria-modal="true" aria-label="Periodic table of elements">
      <ElementsExplorer initialZ={z} onClose={close} />
    </div>
  );
}
