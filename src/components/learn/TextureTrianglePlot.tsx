"use client";

import { useMemo } from "react";
import { classifyTexture, TEXTURE_CLASSES, TEXTURE_INFO, type Composition, type TextureClass } from "@/lib/soil/textureTriangle";

const L = 400;
const H = (L * Math.sqrt(3)) / 2;
const PAD = 40;
const N = 50;

/** Project a composition onto the triangle: sand bottom-left, silt bottom-right, clay top. */
export function project({ silt, clay }: Composition): [number, number] {
  const x = (silt * L + clay * (L / 2)) / 100;
  const y = H - (clay / 100) * H;
  return [x + PAD, y + PAD / 2];
}

function unproject(px: number, py: number): Composition | null {
  const x = px - PAD;
  const y = py - PAD / 2;
  const clay = ((H - y) / H) * 100;
  const silt = (x * 100) / L - clay / 2;
  const sand = 100 - clay - silt;
  if (clay < 0 || silt < 0 || sand < 0) return null;
  return { sand: Math.round(sand), silt: Math.round(silt), clay: Math.round(clay) };
}

function useCells() {
  return useMemo(() => {
    const cells: { d: string; cls: TextureClass }[] = [];
    const sums: Record<string, { x: number; y: number; n: number }> = {};
    const pt = (a: number, b: number) => project({ clay: (a / N) * 100, sand: (b / N) * 100, silt: ((N - a - b) / N) * 100 });
    const add = (verts: [number, number][], comp: Composition) => {
      const cls = classifyTexture(comp);
      cells.push({ d: `M${verts.map((v) => v.map((n) => n.toFixed(1)).join(",")).join("L")}Z`, cls });
      const [cx, cy] = project(comp);
      const s = (sums[cls] ??= { x: 0, y: 0, n: 0 });
      s.x += cx; s.y += cy; s.n++;
    };
    for (let a = 0; a < N; a++) {
      for (let b = 0; a + b < N; b++) {
        add([pt(a, b), pt(a + 1, b), pt(a, b + 1)], {
          clay: ((a + 1 / 3) / N) * 100, sand: ((b + 1 / 3) / N) * 100, silt: ((N - a - b - 2 / 3) / N) * 100,
        });
        if (a + b + 2 <= N) {
          add([pt(a + 1, b), pt(a, b + 1), pt(a + 1, b + 1)], {
            clay: ((a + 2 / 3) / N) * 100, sand: ((b + 2 / 3) / N) * 100, silt: ((N - a - b - 4 / 3) / N) * 100,
          });
        }
      }
    }
    const labels = TEXTURE_CLASSES.filter((c) => sums[c]).map((c) => {
      const [sx, sy] = project({ sand: 100, silt: 0, clay: 0 });
      const [tx, ty] = project({ sand: 0, silt: 100, clay: 0 });
      if (c === "sand") return { cls: c, x: sx + 4, y: sy + 26 };
      if (c === "silt") return { cls: c, x: tx - 4, y: ty + 26 };
      return { cls: c, x: sums[c].x / sums[c].n, y: sums[c].y / sums[c].n };
    });
    return { cells, labels };
  }, []);
}

interface Props {
  value?: Composition;
  onPick?: (c: Composition) => void;
  highlight?: TextureClass | null;
  showLabels?: boolean;
  className?: string;
}

export function TextureTrianglePlot({ value, onPick, highlight, showLabels = true, className }: Props) {
  const { cells, labels } = useCells();
  const marker = value ? project(value) : null;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPick) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const comp = unproject(local.x, local.y);
    if (comp) onPick(comp);
  }

  const ticks = [20, 40, 60, 80];
  return (
    <svg
      viewBox={`0 0 ${L + PAD * 2} ${H + PAD * 1.6}`}
      className={className}
      onClick={handleClick}
      style={{ cursor: onPick ? "crosshair" : undefined }}
      role="img"
      aria-label="USDA soil texture triangle"
    >
      {cells.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill={TEXTURE_INFO[c.cls].color}
          stroke={TEXTURE_INFO[c.cls].color}
          strokeWidth={0.6}
          opacity={highlight && highlight !== c.cls ? 0.35 : 1}
        />
      ))}
      <path
        d={`M${project({ sand: 100, silt: 0, clay: 0 })}L${project({ sand: 0, silt: 100, clay: 0 })}L${project({ sand: 0, silt: 0, clay: 100 })}Z`}
        fill="none" stroke="#2a2017" strokeWidth={2}
      />
      {showLabels &&
        labels.map((l) => (
          <text
            key={l.cls} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
            className={`pointer-events-none select-none text-[11px] font-bold ${l.cls === "sand" || l.cls === "silt" ? "fill-ink" : "fill-white"}`}
            style={l.cls === "sand" || l.cls === "silt" ? undefined : { paintOrder: "stroke", stroke: "rgba(0,0,0,0.45)", strokeWidth: 2.5 }}
          >
            {l.cls}
          </text>
        ))}
      {showLabels && (
        <g className="fill-muted text-[10px] font-semibold">
          {ticks.map((t) => {
            const [cx, cy] = project({ sand: 100 - t, silt: 0, clay: t });
            const [sx, sy] = project({ sand: 0, silt: t, clay: 100 - t });
            const [bx, by] = project({ sand: t, silt: 100 - t, clay: 0 });
            return (
              <g key={t}>
                <text x={cx - 6} y={cy} textAnchor="end" dominantBaseline="middle">{t}</text>
                <text x={sx + 6} y={sy} dominantBaseline="middle">{t}</text>
                <text x={bx} y={by + 14} textAnchor="middle">{t}</text>
              </g>
            );
          })}
          <text x={PAD + L / 4 - 34} y={PAD / 2 + H / 2} textAnchor="middle" transform={`rotate(-60 ${PAD + L / 4 - 34} ${PAD / 2 + H / 2})`} className="fill-clay text-[12px] font-black">% CLAY →</text>
          <text x={PAD + (3 * L) / 4 + 34} y={PAD / 2 + H / 2} textAnchor="middle" transform={`rotate(60 ${PAD + (3 * L) / 4 + 34} ${PAD / 2 + H / 2})`} className="fill-sky text-[12px] font-black">← % SILT</text>
          <text x={PAD + L / 2} y={PAD / 2 + H + 32} textAnchor="middle" className="fill-sun text-[12px] font-black">← % SAND</text>
        </g>
      )}
      {marker && (
        <g className="pointer-events-none">
          <circle cx={marker[0]} cy={marker[1]} r={9} fill="white" stroke="#2a2017" strokeWidth={3} />
          <circle cx={marker[0]} cy={marker[1]} r={3} fill="#2a2017" />
        </g>
      )}
    </svg>
  );
}
