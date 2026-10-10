"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackSide, CanvasTexture, SRGBColorSpace, Vector3, type Mesh } from "three";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries from "world-atlas/countries-110m.json";
import type { SoilRegion } from "@/data/soilRegions";

const R = 1;

export function latLonToVector(lat: number, lon: number, radius = R): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function useEarthTexture() {
  return useMemo(() => {
    const W = 2048;
    const H = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const ocean = ctx.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, "#1d4f73");
    ocean.addColorStop(0.5, "#2a6f99");
    ocean.addColorStop(1, "#1d4f73");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    const path = geoPath(projection, ctx);
    const topo = countries as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

    ctx.beginPath();
    path(geoGraticule10());
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    path(feature(topo, topo.objects.land));
    ctx.fillStyle = "#d9cba3";
    ctx.fill();

    ctx.beginPath();
    path(mesh(topo, topo.objects.countries, (a, b) => a !== b));
    ctx.strokeStyle = "rgba(90,70,45,0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

interface MarkerProps {
  region: SoilRegion;
  color: string;
  selected: boolean;
  dimmed: boolean;
  hidden: boolean;
  onSelect: () => void;
  globe: React.RefObject<Mesh | null>;
}

function Marker({ region, color, selected, dimmed, hidden, onSelect, globe }: MarkerProps) {
  const [hover, setHover] = useState(false);
  const ring = useRef<Mesh>(null);
  const pos = useMemo(() => latLonToVector(region.lat, region.lon, R), [region]);
  const quaternionTarget = useMemo(() => pos.clone().normalize(), [pos]);

  useFrame(({ clock }) => {
    if (ring.current) {
      const s = 1 + ((clock.elapsedTime * 1.5) % 1) * 1.5;
      ring.current.scale.setScalar(s);
      (ring.current.material as { opacity: number }).opacity = 1 - ((clock.elapsedTime * 1.5) % 1);
    }
  });

  const size = selected ? 0.034 : hover ? 0.028 : 0.022;
  return (
    <group
      position={pos}
      onUpdate={(g) => g.lookAt(quaternionTarget.clone().multiplyScalar(2))}
    >
      <mesh
        position={[0, 0, 0.02]}
        visible={!hidden}
        onClick={(e) => { if (hidden) return; e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { if (hidden) return; e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[size, 16, 12]} />
        <meshStandardMaterial
          color={hidden ? "#ffffff" : color}
          emissive={hidden ? "#ffffff" : color}
          emissiveIntensity={selected ? 0.6 : 0.25}
          transparent
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} visible={!hidden}>
        <cylinderGeometry args={[0.004, 0.004, 0.02, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={dimmed ? 0.25 : 0.9} />
      </mesh>
      {selected && (
        <mesh ref={ring} position={[0, 0, 0.005]}>
          <ringGeometry args={[0.03, 0.038, 32]} />
          <meshBasicMaterial color="#ffffff" transparent />
        </mesh>
      )}
      {(hover || selected) && !hidden && (
        <Html position={[0, 0, 0.06]} center zIndexRange={[30, 0]} occlude={[globe as React.RefObject<Mesh>]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white shadow">{region.name}</div>
        </Html>
      )}
    </group>
  );
}

function CameraFocus({ target }: { target: SoilRegion | null }) {
  const { camera } = useThree();
  const goal = useRef<Vector3 | null>(null);
  useEffect(() => {
    if (!target) return;
    goal.current = latLonToVector(target.lat, target.lon, camera.position.length());
  }, [target, camera]);
  useFrame(() => {
    if (!goal.current) return;
    const dist = camera.position.length();
    camera.position.lerp(goal.current, 0.07).setLength(dist);
    if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
  });
  return null;
}

interface GlobeProps {
  regions: SoilRegion[];
  colorFor: (r: SoilRegion) => string;
  selectedId: string | null;
  isDimmed: (r: SoilRegion) => boolean;
  hideAnswers: boolean;
  onSelect: (r: SoilRegion) => void;
}

function Earth({ regions, colorFor, selectedId, isDimmed, hideAnswers, onSelect }: GlobeProps) {
  const texture = useEarthTexture();
  const globe = useRef<Mesh>(null);
  return (
    <group>
      <mesh ref={globe}>
        <sphereGeometry args={[R, 96, 64]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[R, 48, 32]} />
        <meshBasicMaterial color="#8fd0ff" transparent opacity={0.08} side={BackSide} />
      </mesh>
      {regions.map((r) => (
        <Marker
          key={r.id}
          region={r}
          color={colorFor(r)}
          selected={selectedId === r.id}
          dimmed={isDimmed(r)}
          hidden={hideAnswers && selectedId !== r.id}
          onSelect={() => onSelect(r)}
          globe={globe}
        />
      ))}
    </group>
  );
}

export default function Globe3D(props: GlobeProps) {
  const selected = props.regions.find((r) => r.id === props.selectedId) ?? null;
  return (
    <Canvas camera={{ position: latLonToVector(25, -40, 3.1).toArray(), fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} />
      <directionalLight position={[-5, -2, -4]} intensity={0.35} />
      <Earth {...props} />
      <CameraFocus target={selected} />
      <OrbitControls makeDefault enablePan={false} minDistance={1.6} maxDistance={5} rotateSpeed={0.5} autoRotate={!selected} autoRotateSpeed={0.4} />
    </Canvas>
  );
}
