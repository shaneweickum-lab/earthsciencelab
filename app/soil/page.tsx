import Link from "next/link";
import { BadgeShelf } from "@/components/BadgeShelf";
import { SoilStats } from "@/components/SoilStats";

const AREAS = [
  {
    href: "/soil/learn", icon: "📖", title: "Learn: Soil Health", color: "bg-leaf",
    text: "Six quick lessons on what soil is, how it works, and how to keep it healthy. Earn XP for every quiz.",
  },
  {
    href: "/soil/game", icon: "🚜", title: "Regenerate the Field", color: "bg-soil",
    text: "You've inherited a worn-out farm. Use cover crops, compost, and no-till to bring it back to life in 3 years.",
  },
  {
    href: "/soil/globe", icon: "🌍", title: "Soil Globe", color: "bg-sky",
    text: "Spin the Earth and discover the soils of the world, from Amazon red clay to Ukrainian black earth.",
  },
];

export default function SoilHome() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Lab 1</p>
          <h1 className="font-display text-4xl font-black">Soil Science</h1>
          <p className="mt-1 max-w-xl text-muted">
            Soil feeds the world, cleans our water, and stores more carbon than all the plants on Earth. Let&apos;s dig in.
          </p>
        </div>
        <SoilStats />
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {AREAS.map((a) => (
          <Link key={a.href} href={a.href} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1">
            <div className={`${a.color} grid h-32 place-items-center text-6xl`}>
              <span className="transition group-hover:scale-110">{a.icon}</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-xl font-black">{a.title}</h2>
              <p className="mt-2 flex-1 text-muted">{a.text}</p>
              <span className="mt-4 font-bold text-leaf">Let&apos;s go →</span>
            </div>
          </Link>
        ))}
      </div>

      <BadgeShelf />
    </div>
  );
}
