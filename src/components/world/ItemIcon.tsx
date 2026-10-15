import { ITEMS } from "@/world/items";

/** An item's picture icon, or its emoji when it has none. */
export function ItemIcon({ id, className = "" }: { id: string; className?: string }) {
  const def = ITEMS[id];
  if (def.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={def.image} alt="" aria-hidden className={`h-[1.3em] w-[1.3em] object-contain ${className}`} draggable={false} />;
  }
  return <span aria-hidden className={className}>{def.icon}</span>;
}
