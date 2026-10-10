"use client";

import { useEffect } from "react";
import { useProgress } from "@/store/progress";
import { BadgeToast } from "./BadgeToast";
import { ElementsOverlay } from "./elements/ElementsOverlay";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useProgress.persist.rehydrate();
  }, []);
  return (
    <>
      {children}
      <ElementsOverlay />
      <BadgeToast />
    </>
  );
}
