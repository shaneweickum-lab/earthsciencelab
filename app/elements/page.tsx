import { ElementsExplorer } from "@/components/elements/ElementsExplorer";

export const metadata = { title: "Periodic Table · Earth Science Lab" };

export default async function ElementsPage({ searchParams }: { searchParams: Promise<{ z?: string }> }) {
  const z = Number((await searchParams).z);
  const initialZ = Number.isInteger(z) && z >= 1 && z <= 118 ? z : null;
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <ElementsExplorer initialZ={initialZ} />
    </div>
  );
}
