"use client";

import { useEffect, type RefObject } from "react";
import { create } from "zustand";

type Webkit = { webkitRequestFullscreen?: () => Promise<void> | void; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenElement?: Element | null };

const fullscreenElement = () => document.fullscreenElement ?? (document as Document & Webkit).webkitFullscreenElement ?? null;

/**
 * Playing full screen. The game registers its container; the button, the F key, and the pause
 * menu toggle it. Browsers that can't make an element full screen (iPhones) get a full-window
 * mode instead: the container covers the page and the page stops scrolling.
 */
interface FullscreenState {
  /** The game is filling the screen (or the window). */
  full: boolean;
  /** Full-window mode, where the browser has no full screen for elements. */
  fallback: boolean;
  target: HTMLElement | null;
  toggle: () => void;
  exit: () => void;
}

export const useFullscreen = create<FullscreenState>((set, get) => ({
  full: false,
  fallback: false,
  target: null,
  toggle: () => {
    if (get().full) return get().exit();
    const el = get().target as (HTMLElement & Webkit) | null;
    if (!el) return;
    const request = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    // Fall back to filling the window if the browser can't (or won't) go full screen.
    const windowed = () => set({ full: true, fallback: true });
    if (!request || document.fullscreenEnabled === false) return windowed();
    try {
      Promise.resolve(request()).catch(windowed);
    } catch {
      windowed();
    }
  },
  exit: () => {
    if (get().fallback) return set({ full: false, fallback: false });
    const doc = document as Document & Webkit;
    if (fullscreenElement()) void Promise.resolve((doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc))?.()).catch(() => {});
  },
}));

/** Register the element that goes full screen, and keep the state in step with the browser. */
export function useFullscreenTarget(ref: RefObject<HTMLElement | null>) {
  const fallback = useFullscreen((s) => s.fallback);
  useEffect(() => {
    useFullscreen.setState({ target: ref.current });
    const sync = () => {
      const el = fullscreenElement();
      if (!useFullscreen.getState().fallback) useFullscreen.setState({ full: !!el && el === ref.current });
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      useFullscreen.getState().exit();
      useFullscreen.setState({ target: null, full: false, fallback: false });
    };
  }, [ref]);
  // In full-window mode the page behind mustn't scroll.
  useEffect(() => {
    if (!fallback) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fallback]);
}

/** Classes for the game's container while it fills the screen or the window. */
export const fullClasses = (full: boolean, fallback: boolean) =>
  full ? `h-screen! w-screen! min-h-0! rounded-none! ${fallback ? "fixed! inset-0 z-[60]" : ""}` : "";
