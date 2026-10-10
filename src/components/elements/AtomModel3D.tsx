"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, Float32BufferAttribute, Object3D, type Group, type InstancedMesh } from "three";

const MAX_NUCLEONS = 300;
const PROTON = new Color("#e5484d");
const NEUTRON = new Color("#b9bcc6");
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function nucleusRadius(count: number) {
  return 0.13 * Math.cbrt(Math.min(count, MAX_NUCLEONS));
}

export function shellRadius(nucleusR: number, shell: number) {
  return nucleusR + 0.55 + shell * 0.48;
}

/** A packed ball of protons and neutrons. Very heavy nuclei are drawn with fewer, scaled particles. */
function Nucleus({ protons, neutrons }: { protons: number; neutrons: number }) {
  const ref = useRef<InstancedMesh>(null);
  const total = protons + neutrons;
  const shown = Math.min(total, MAX_NUCLEONS);
  const shownProtons = Math.round((protons / total) * shown);
  const R = nucleusRadius(total);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    // Spread protons evenly through the list so colors mix instead of forming layers.
    let p = 0;
    for (let i = 0; i < shown; i++) {
      const r = shown === 1 ? 0 : R * Math.cbrt((i + 0.5) / shown);
      const y = 1 - (2 * (i + 0.5)) / shown;
      const ring = Math.sqrt(1 - y * y);
      const theta = GOLDEN * i;
      dummy.position.set(Math.cos(theta) * ring * r, y * r, Math.sin(theta) * ring * r);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const isProton = Math.floor(((i + 1) * shownProtons) / shown) > p;
      if (isProton) p++;
      mesh.setColorAt(i, isProton ? PROTON : NEUTRON);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [shown, shownProtons, R]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, shown]} key={shown}>
      <sphereGeometry args={[0.085, 14, 10]} />
      <meshStandardMaterial roughness={0.45} />
    </instancedMesh>
  );
}

function Shell({ radius, count, index, playing }: { radius: number; count: number; index: number; playing: boolean }) {
  const spin = useRef<Group>(null);
  const tilt = useMemo(() => [index * 0.7 + 0.3, index * 1.3, index * 0.4] as const, [index]);
  useFrame((_, dt) => {
    if (playing && spin.current) spin.current.rotation.z += dt * (1.6 / (index + 1));
  });
  return (
    <group rotation={tilt as unknown as [number, number, number]}>
      <mesh>
        <torusGeometry args={[radius, 0.008, 6, 96]} />
        <meshBasicMaterial color="#7fb8e6" transparent opacity={0.45} />
      </mesh>
      <group ref={spin}>
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}>
              <sphereGeometry args={[0.055, 12, 8]} />
              <meshStandardMaterial color="#3f9bff" emissive="#3f9bff" emissiveIntensity={0.6} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Fuzzy probability cloud: denser near each shell's radius, closer to the modern picture. */
function Cloud({ shells, nucleusR, playing }: { shells: number[]; nucleusR: number; playing: boolean }) {
  const ref = useRef<Group>(null);
  const positions = useMemo(() => {
    const pts: number[] = [];
    let seed = 1;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    shells.forEach((count, k) => {
      const r0 = shellRadius(nucleusR, k);
      const n = 250 + count * 40;
      for (let i = 0; i < n; i++) {
        const u = rand() * 2 - 1;
        const t = rand() * Math.PI * 2;
        const ring = Math.sqrt(1 - u * u);
        // Box-Muller gives a soft spread around the shell radius.
        const g = Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
        const r = Math.max(nucleusR, r0 + g * 0.16);
        pts.push(Math.cos(t) * ring * r, u * r, Math.sin(t) * ring * r);
      }
    });
    return new Float32BufferAttribute(pts, 3);
  }, [shells, nucleusR]);
  useFrame((_, dt) => {
    if (playing && ref.current) ref.current.rotation.y += dt * 0.2;
  });
  return (
    <group ref={ref}>
      <points>
        <bufferGeometry attributes={{ position: positions }} />
        <pointsMaterial color="#5aaeff" size={0.045} transparent opacity={0.55} depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  );
}

export default function AtomModel3D({
  protons, neutrons, shells, mode, playing,
}: { protons: number; neutrons: number; shells: number[]; mode: "bohr" | "cloud"; playing: boolean }) {
  const R = nucleusRadius(protons + neutrons);
  const outer = shellRadius(R, shells.length - 1);
  return (
    <Canvas camera={{ position: [0, outer * 0.9, outer * 2.6], fov: 45 }} dpr={[1, 2]} key={`${protons}-${shells.length}`}>
      <color attach="background" args={["#0d1322"]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 4, 5]} intensity={40} />
      <directionalLight position={[-3, 2, 4]} intensity={0.8} />
      <Nucleus protons={protons} neutrons={neutrons} />
      {mode === "bohr"
        ? shells.map((count, i) => <Shell key={i} radius={shellRadius(R, i)} count={count} index={i} playing={playing} />)
        : <Cloud shells={shells} nucleusR={R} playing={playing} />}
      <OrbitControls enablePan={false} minDistance={1.2} maxDistance={outer * 5} />
    </Canvas>
  );
}
