"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useElementsPanel } from "@/store/elementsPanel";
import { XPBar } from "./XPBar";

const SOIL_LINKS = [
  { href: "/soil/learn", label: "Learn", icon: "📖" },
  { href: "/soil/game", label: "Game", icon: "🚜" },
  { href: "/soil/globe", label: "Globe", icon: "🌍" },
];

export function SiteHeader() {
  const path = usePathname();
  const inSoil = path.startsWith("/soil");
  const openElements = useElementsPanel((s) => s.open);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="text-2xl">🌎</span>
          <span className="hidden font-display text-lg sm:inline">Earth Science Lab</span>
        </Link>
        {inSoil && (
          <nav className="ml-1 flex items-center gap-1 sm:ml-4">
            <Link
              href="/soil"
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${path === "/soil" ? "bg-soil text-white" : "hover:bg-card"}`}
            >
              Soil
            </Link>
            {SOIL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-2.5 py-1.5 text-sm font-semibold sm:px-3 ${
                  path.startsWith(l.href) ? "bg-soil text-white" : "hover:bg-card"
                }`}
              >
                <span className="sm:mr-1">{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {path === "/elements" ? null : (
            <button
              onClick={() => openElements()}
              title="Periodic table (press E)"
              aria-label="Open the periodic table"
              className="flex items-center gap-1.5 rounded-full border-2 border-line bg-card px-2.5 py-1 text-sm font-bold hover:border-sky"
            >
              <span>⚛️</span>
              <span className="hidden md:inline">Elements</span>
              <kbd className="hidden rounded border border-line px-1 text-[10px] text-muted lg:inline">E</kbd>
            </button>
          )}
          <XPBar compact />
        </div>
      </div>
    </header>
  );
}
