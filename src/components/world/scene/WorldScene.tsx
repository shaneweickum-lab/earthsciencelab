"use client";

import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { BufferAttribute, Color, LoopOnce, type AmbientLight, type DirectionalLight, type Group, type Mesh, type PointLight, type Points } from "three";
import { daylight, dayOf, msPerGameMinute, seasonOf, timeOfDay } from "@/world/clock";
import { canPlace, DIRS, facingTile, movePlayer, placementFor, tick, todayWeather } from "@/world/engine";
import { ITEMS } from "@/world/items";
import { BUILDING_SIZE } from "@/world/map";
import { critterIcon, expireCritters } from "@/world/nature";
import { NPCS, npcPose, type Npc } from "@/world/town";
import type { WeatherId, WorldState } from "@/world/types";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { DEFAULT_AVATAR } from "@/world/avatars";
import { labelLayer, runtime, useWorld } from "../useWorld";
import { Buildings } from "./Buildings";
import { Crops } from "./Crops";
import { model } from "./models";
import { MineScene } from "./Mine";
import { Obstacles, Pond, Terrain } from "./Terrain";

const SPEED = 4.2; // tiles per second
const DAY_SKY = new Color("#bfe3f2");
const DUSK_SKY = new Color("#f2b48a");
const NIGHT_SKY = new Color("#0f1a2e");
const GRAY_SKY = new Color("#a9b5bf");
const tmpColor = new Color();

/** Moves the player, runs the game clock, and keeps the camera following. */
function GameLoop() {
  const acc = useRef(0);
  const zoom = useRef(1);
  const lastPlace = useRef("");
  const { camera, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.min(1.7, Math.max(0.55, zoom.current * (e.deltaY > 0 ? 1.08 : 0.93)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useWorld.getState();
    const w = store.world;
    if (!w) return;
    const paused = store.menu !== null || (typeof document !== "undefined" && document.hidden);

    // Movement.
    if (!paused) {
      const k = runtime.keys;
      let dx = (k.has("right") ? 1 : 0) - (k.has("left") ? 1 : 0);
      let dy = (k.has("down") ? 1 : 0) - (k.has("up") ? 1 : 0);
      runtime.moving = dx !== 0 || dy !== 0;
      if (runtime.moving) {
        const len = Math.hypot(dx, dy);
        dx = (dx / len) * SPEED * dt;
        dy = (dy / len) * SPEED * dt;
        const before = runtime.player;
        const p = movePlayer({ ...w, player: before }, dx, dy);
        runtime.player = p;
        if (Math.round(p.x) !== Math.round(before.x) || Math.round(p.y) !== Math.round(before.y) || p.facing !== before.facing) {
          useWorld.setState({ world: { ...w, player: p } });
        }
      }
    } else {
      runtime.moving = false;
    }

    // Clock: game time only passes while you're playing.
    if (!paused) {
      acc.current += dt * 1000;
      const ms = msPerGameMinute(w.settings.speed);
      const minutes = Math.floor(acc.current / ms);
      runtime.minuteFrac = Math.min(0.999, acc.current / ms);
      if (minutes > 0) {
        acc.current -= minutes * ms;
        runtime.minuteFrac = acc.current / ms;
        const before = useWorld.getState().world!;
        store.update((s) => expireCritters(tick(s, minutes)));
        const after = useWorld.getState().world!;
        if (dayOf(after.minute) !== dayOf(before.minute)) {
          store.save();
          store.open("summary");
        } else if (Math.floor(after.minute / 60) !== Math.floor(before.minute / 60)) {
          store.save();
        }
      }
    }

    // Camera follows the player (and jumps there when you go in or out of the mine).
    const p = runtime.player;
    const z = zoom.current;
    const tx = p.x, ty = 0, tz = p.y + 0.5;
    const place = w.mine ? `mine-${w.mine.floor}` : "up";
    if (place !== lastPlace.current) {
      lastPlace.current = place;
      camera.position.set(tx, ty + 12 * z, tz + 9.5 * z);
    }
    camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 5);
    camera.position.y += (ty + 12 * z - camera.position.y) * Math.min(1, dt * 5);
    camera.position.z += (tz + 9.5 * z - camera.position.z) * Math.min(1, dt * 5);
    camera.lookAt(camera.position.x, 0, camera.position.z - 9.5 * z);
  });
  return null;
}

/** The hand-built farmer, shown while the character model loads. */
function SimpleFarmer() {
  const body = useRef<Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (runtime.moving) t.current += dt * 12;
    if (body.current) body.current.position.y = runtime.moving ? Math.abs(Math.sin(t.current)) * 0.08 : 0;
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.32, 0]} castShadow><capsuleGeometry args={[0.2, 0.3, 4, 8]} /><meshStandardMaterial color="#3f6fa0" flatShading /></mesh>
      <mesh position={[0, 0.78, 0]} castShadow><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color="#e8b98f" flatShading /></mesh>
      <mesh position={[0, 0.92, 0]}><cylinderGeometry args={[0.36, 0.36, 0.03, 16]} /><meshStandardMaterial color="#e0c27a" flatShading /></mesh>
      <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.16, 0.19, 0.16, 12]} /><meshStandardMaterial color="#d6b04a" flatShading /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0.8, 0.17]}><sphereGeometry args={[0.025, 6, 5]} /><meshStandardMaterial color="#2a2017" /></mesh>
      ))}
    </group>
  );
}

/** A Kenney mini character that walks, idles, and reaches out when you use a tool. */
function Farmer({ avatar }: { avatar: string }) {
  const { scene, animations } = useGLTF(model("characters", `character-${avatar}`));
  const clone = useMemo(() => {
    const c = cloneSkinned(scene);
    c.traverse((o) => (o.castShadow = true));
    return c;
  }, [scene]);
  const ref = useRef<Group>(null);
  const { actions } = useAnimations(animations, ref);
  const current = useRef<string>("");
  const seenAction = useRef(runtime.actionAt);
  useFrame(() => {
    let next = runtime.moving ? "walk" : "idle";
    if (runtime.actionAt !== seenAction.current) {
      seenAction.current = runtime.actionAt;
      const reach = actions["interact-right"];
      if (reach) {
        reach.reset().setLoop(LoopOnce, 1).fadeIn(0.05).play();
        reach.clampWhenFinished = false;
      }
    }
    if (actions["interact-right"]?.isRunning() && !runtime.moving) next = "interact-right";
    if (next !== current.current) {
      const prev = actions[current.current];
      const act = actions[next];
      if (act) {
        if (next !== "interact-right") act.reset().fadeIn(0.15).play();
        prev?.fadeOut(0.15);
        current.current = next;
      }
    }
  });
  return <primitive ref={ref} object={clone} scale={1.35} />;
}

/** A townsperson: walks their daily route with walk and idle animations, and shows a name tag nearby. */
function NpcFigure({ npc }: { npc: Npc }) {
  const { scene, animations } = useGLTF(model("characters", `character-${npc.avatar}`));
  const clone = useMemo(() => {
    const c = cloneSkinned(scene);
    c.traverse((o) => (o.castShadow = true));
    return c;
  }, [scene]);
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const tag = useRef<HTMLDivElement>(null);
  const { actions } = useAnimations(animations, body);
  const current = useRef("");
  const ROT = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
  useFrame((_, dt) => {
    const w = useWorld.getState().world;
    const g = group.current;
    if (!w || !g) return;
    const pose = npcPose(w, npc, w.minute + runtime.minuteFrac);
    g.visible = pose.visible;
    g.position.set(pose.x, 0, pose.y);
    let diff = ROT[pose.facing] - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, dt * 10);
    const next = pose.moving ? "walk" : "idle";
    if (next !== current.current && actions[next]) {
      actions[current.current]?.fadeOut(0.2);
      actions[next]!.reset().fadeIn(0.2).play();
      current.current = next;
    }
    if (tag.current) {
      const near = Math.hypot(pose.x - runtime.player.x, pose.y - runtime.player.y) < 4.5;
      tag.current.style.display = pose.visible && near ? "block" : "none";
    }
  });
  return (
    <group ref={group}>
      <group ref={body}>
        <primitive object={clone} scale={1.35 * (npc.scale ?? 1)} />
      </group>
      <Html position={[0, 1.55 * (npc.scale ?? 1), 0]} center zIndexRange={[30, 0]} portal={labelLayer as React.MutableRefObject<HTMLElement>} style={{ pointerEvents: "none" }}>
        <div ref={tag} className="whitespace-nowrap rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-black shadow" style={{ display: "none" }}>
          {npc.short}
        </div>
      </Html>
    </group>
  );
}

function Townsfolk() {
  return (
    <>
      {NPCS.map((npc) => (
        <Suspense key={npc.id} fallback={null}>
          <NpcFigure npc={npc} />
        </Suspense>
      ))}
    </>
  );
}

function Player() {
  const ref = useRef<Group>(null);
  const lamp = useRef<PointLight>(null);
  const avatar = useWorld((s) => s.world!.avatar ?? DEFAULT_AVATAR);
  const ROT = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = runtime.player;
    g.position.set(p.x, 0, p.y);
    const target = ROT[p.facing];
    let diff = target - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, dt * 14);
    const w = useWorld.getState().world;
    // Your lantern lights up at night, and always underground.
    if (lamp.current && w) lamp.current.intensity = w.mine ? 9 : (1 - daylight(w.minute)) * 6;
  });
  return (
    <group ref={ref}>
      <Suspense fallback={<SimpleFarmer />}>
        <Farmer avatar={avatar} />
      </Suspense>
      <pointLight ref={lamp} position={[0, 1.6, 0.3]} color="#ffcf8a" distance={7} decay={1.6} intensity={0} />
    </group>
  );
}

/** Square outline on the tile you're about to work on. */
function FacingMarker() {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = runtime.player;
    const [dx, dy] = DIRS[p.facing];
    ref.current.position.set(Math.round(p.x) + dx, 0.07, Math.round(p.y) + dy);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.68, 4, 1, Math.PI / 4]} />
      <meshBasicMaterial color="#fffcf5" transparent opacity={0.85} />
    </mesh>
  );
}

/** A see-through preview of the building you're about to place: green if it fits, red if not. */
function BuildGhost() {
  const w = useWorld((s) => s.world!);
  const slot = w.inventory[w.selected];
  const kind = slot ? ITEMS[slot.item].building : undefined;
  if (!kind) return null;
  const f = facingTile(w);
  const o = placementFor(w, kind, f.x, f.y);
  const ok = canPlace(w, kind, o.x, o.y) === null;
  const [bw, bh] = BUILDING_SIZE[kind];
  return (
    <mesh position={[o.x + (bw - 1) / 2, 0.5, o.y + (bh - 1) / 2]}>
      <boxGeometry args={[bw - 0.05, 1, bh - 0.05]} />
      <meshBasicMaterial color={ok ? "#5fd16f" : "#e0533d"} transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

function Sky() {
  const sun = useRef<DirectionalLight>(null);
  const amb = useRef<AmbientLight>(null);
  const { scene } = useThree();
  useFrame(() => {
    const w = useWorld.getState().world;
    if (!w) return;
    const d = daylight(w.minute);
    const h = (timeOfDay(w.minute) % 1440) / 60;
    const weather = todayWeather(w);
    const gloomy = weather === "rain" || weather === "storm" || weather === "fog" || weather === "snow" || weather === "cloudy";
    const dusk = h > 17 && h < 21 ? 1 - Math.abs(h - 19) / 2 : h > 5 && h < 8 ? 1 - Math.abs(h - 6.5) / 1.5 : 0;
    tmpColor.copy(NIGHT_SKY).lerp(gloomy ? GRAY_SKY : DAY_SKY, d);
    if (!gloomy) tmpColor.lerp(DUSK_SKY, Math.max(0, dusk) * 0.6);
    if (scene.background instanceof Color) scene.background.copy(tmpColor);
    else scene.background = tmpColor.clone();
    if (scene.fog) scene.fog.color.copy(tmpColor);
    if (sun.current) {
      sun.current.intensity = 0.15 + d * (gloomy ? 1.1 : 2.2);
      const angle = ((h - 6) / 14) * Math.PI;
      sun.current.position.set(runtime.player.x + Math.cos(angle) * 14, 6 + Math.sin(Math.max(0.2, angle)) * 14, runtime.player.y + 6);
      sun.current.target.position.set(runtime.player.x, 0, runtime.player.y);
      sun.current.target.updateMatrixWorld();
      sun.current.color.set(dusk > 0.3 ? "#ffd2a0" : "#fff6e5");
    }
    if (amb.current) {
      amb.current.intensity = 0.35 + d * 0.65;
      amb.current.color.set(d < 0.3 ? "#7b8fd1" : "#ffffff");
    }
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.8} />
      <hemisphereLight args={["#fff6e5", "#6b4423", 0.35]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
    </>
  );
}

/** Rain or snow falling around the player. */
function Precipitation({ weather }: { weather: WeatherId }) {
  const ref = useRef<Points>(null);
  const kind = weather === "rain" || weather === "storm" ? "rain" : weather === "snow" ? "snow" : null;
  const count = weather === "storm" ? 1400 : 900;
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 30;
      a[i * 3 + 1] = Math.random() * 12;
      a[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as BufferAttribute;
    const arr = attr.array as Float32Array;
    const fall = kind === "rain" ? 14 : 1.6;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= fall * dt;
      if (kind === "snow") arr[i * 3] += Math.sin(arr[i * 3 + 1] + i) * dt * 0.3;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] += 12;
    }
    attr.needsUpdate = true;
    pts.position.set(runtime.player.x, 0, runtime.player.y);
  });
  if (!kind) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={kind === "rain" ? "#a9c9e6" : "#ffffff"} size={kind === "rain" ? 0.06 : 0.12} transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

function Critters({ critters }: { critters: WorldState["critters"] }) {
  return (
    <group>
      {critters.map((c) => (
        <Html key={c.id} position={[c.x, 0.5, c.y]} center zIndexRange={[30, 0]} portal={labelLayer as React.MutableRefObject<HTMLElement>} style={{ pointerEvents: "none" }}>
          <div className="animate-bounce select-none text-2xl drop-shadow">{critterIcon(c.kind)}</div>
        </Html>
      ))}
    </group>
  );
}

function World() {
  const underground = useWorld((s) => !!s.world!.mine);
  if (underground) {
    return (
      <>
        <MineScene />
        <Player />
        <FacingMarker />
        <GameLoop />
      </>
    );
  }
  return <Surface />;
}

function Surface() {
  const tiles = useWorld((s) => s.world!.tiles);
  const buildings = useWorld((s) => s.world!.buildings);
  const critters = useWorld((s) => s.world!.critters);
  const season = useWorld((s) => seasonOf(dayOf(s.world!.minute), s.world!.settings));
  const weather = useWorld((s) => todayWeather(s.world!));
  return (
    <>
      <Sky />
      {weather === "fog" ? <fog attach="fog" args={["#a9b5bf", 6, 22]} /> : <fog attach="fog" args={["#bfe3f2", 30, 60]} />}
      <Terrain tiles={tiles} season={season} />
      <Pond tiles={tiles} />
      <Obstacles tiles={tiles} season={season} buildings={buildings} />
      <Crops tiles={tiles} />
      <Buildings buildings={buildings} />
      <Critters critters={critters} />
      <Player />
      <Townsfolk />
      <FacingMarker />
      <BuildGhost />
      <Precipitation weather={weather} />
      <GameLoop />
    </>
  );
}

export default function WorldScene() {
  const p = runtime.player;
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 40, position: [p.x, 12, p.y + 10], near: 0.5, far: 120 }}
      gl={{ antialias: true }}
      aria-label="Your farm"
    >
      <World />
    </Canvas>
  );
}
