"use client";

import { useEffect } from "react";
import { useProgress } from "@/store/progress";
import { BadgeToast } from "./BadgeToast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useProgress.persist.rehydrate();
  }, []);
  return (
    <>
      {children}
      <BadgeToast />
    </>
  );
}
