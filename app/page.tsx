import Link from "next/link";

const SCIENCES = [
  { id: "soil", name: "Soil Science", icon: "🪱", color: "from-[#6b4423] to-[#3d2716]", blurb: "Dig into the living skin of the Earth.", href: "/soil" },
  { id: "earth", name: "Earth Science", icon: "🌋", color: "from-[#8a5a44] to-[#4a3a33]", blurb: "Volcanoes, plates, rocks, and time." },
  { id: "environment", name: "Environmental Science", icon: "🌳", color: "from-[#3f7d4e] to-[#25502f]", blurb: "Ecosystems, climate, and how we fit in." },
  { id: "biology", name: "Biology", icon: "🧬", color: "from-[#3f86b0] to-[#24506b]", blurb: "Cells, creatures, and the web of life." },
  { id: "chemistry", name: "Chemistry", icon: "⚗️", color: "from-[#8f5bd6] to-[#4f2f80]", blurb: "Atoms, reactions, and the stuff of everything." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="soil-texture-bg relative overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-sun">Welcome, scientist</p>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
            Explore the planet. <br />Level up as you learn.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Play games, spin 3D worlds, and earn badges while you discover how Earth works, starting with the ground beneath your feet.
          </p>
          <Link href="/soil" className="btn btn-primary mt-6 text-lg">
            Start with Soil Science →
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-6 bottom-0 select-none text-[9rem] leading-none opacity-30 sm:right-10 sm:text-[12rem]">
          🌱
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-black">Choose a lab</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCIENCES.map((s) => {
            const inner = (
              <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} p-6 text-white`}>
                <div className="text-5xl">{s.icon}</div>
                <h3 className="mt-3 text-xl font-black">{s.name}</h3>
                <p className="mt-1 text-white/80">{s.blurb}</p>
                <div className="mt-4 text-sm font-bold">
                  {s.href ? <span className="rounded-full bg-white/20 px-3 py-1">Open lab →</span> : <span className="rounded-full bg-black/25 px-3 py-1">🔒 Coming soon</span>}
                </div>
              </div>
            );
            return s.href ? (
              <Link key={s.id} href={s.href} className="block transition hover:-translate-y-1">
                {inner}
              </Link>
            ) : (
              <div key={s.id} className="opacity-60 grayscale-[40%]" aria-disabled>
                {inner}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
