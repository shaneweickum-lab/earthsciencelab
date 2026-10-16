import Link from "next/link";
import { SOURCES, SOURCE_IDS, type SourceType } from "@/content/soil/sources";

export const metadata = { title: "Sources · Soil Science · Earth Science Lab" };

const GROUPS: { type: SourceType; title: string }[] = [
  { type: "government", title: "U.S. government science agencies" },
  { type: "scientific-society", title: "Scientific societies" },
  { type: "international", title: "International organizations" },
  { type: "museum", title: "Museums" },
  { type: "textbook", title: "Textbooks" },
  { type: "classic", title: "Classic research" },
  { type: "standards", title: "Education standards" },
];

const GAME_ART = [
  { name: "Nature Kit", url: "https://kenney.nl/assets/nature-kit" },
  { name: "Fantasy Town Kit", url: "https://kenney.nl/assets/fantasy-town-kit" },
  { name: "Survival Kit", url: "https://kenney.nl/assets/survival-kit" },
  { name: "Food Kit", url: "https://kenney.nl/assets/food-kit" },
  { name: "Mini Characters", url: "https://kenney.nl/assets/mini-characters" },
];

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky">Where our facts come from</p>
        <h1 className="font-display text-4xl font-black">Sources</h1>
        <p className="mt-1 text-muted">
          Every soil lesson is built from these trusted sources. Each lesson lists the ones it uses, and many sections show their source right under the text.
          See also the <Link href="/soil/teach" className="font-bold underline">Teacher Guide</Link>.
        </p>
      </header>
      {GROUPS.map((g) => {
        const items = SOURCE_IDS.map((id) => SOURCES[id]).filter((s) => s.type === g.type);
        if (items.length === 0) return null;
        return (
          <section key={g.type} className="card p-5">
            <h2 className="mb-3 text-xl font-black">{g.title}</h2>
            <ul className="space-y-3">
              {items.map((s) => (
                <li key={s.id} className="text-sm">
                  <div>
                    <span className="font-semibold">{s.org}</span> ({s.year}).{" "}
                    {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="italic underline decoration-dotted">{s.title}</a> : <em>{s.title}</em>}
                  </div>
                  <div className="text-muted">Used for: {s.usedFor}</div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="card p-5" id="game-art">
        <h2 className="mb-3 text-xl font-black">Game art</h2>
        <p className="text-sm">
          The 3D models and item pictures in Soil &amp; Sprout come from{" "}
          <a href="https://kenney.nl" target="_blank" rel="noreferrer" className="font-semibold underline">Kenney</a>&apos;s free{" "}
          {GAME_ART.map((p, i) => (
            <span key={p.url}>
              {i > 0 && (i === GAME_ART.length - 1 ? ", and " : ", ")}
              <a href={p.url} target="_blank" rel="noreferrer" className="italic underline decoration-dotted">{p.name}</a>
            </span>
          ))}
          , plus{" "}
          <a href="https://quaternius.com/packs/ultimatecrops.html" target="_blank" rel="noreferrer" className="font-semibold underline">Quaternius</a>&apos;s
          {" "}<span className="italic">Ultimate Crops</span> for carrots, corn, pumpkins, tomatoes, and wheat. All are shared under the{" "}
          <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer" className="underline">CC0 public domain dedication</a>.
        </p>
      </section>
    </div>
  );
}
