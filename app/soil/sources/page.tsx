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
    </div>
  );
}
