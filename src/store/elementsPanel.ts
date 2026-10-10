"use client";

import { create } from "zustand";

interface ElementsPanelState {
  isOpen: boolean;
  /** Element to show when the overlay opens. */
  z: number | null;
  open: (z?: number) => void;
  close: () => void;
}

export const useElementsPanel = create<ElementsPanelState>()((set) => ({
  isOpen: false,
  z: null,
  open: (z) => set((s) => ({ isOpen: true, z: z ?? s.z })),
  close: () => set({ isOpen: false }),
}));
