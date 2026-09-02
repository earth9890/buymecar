"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/refs, react-hooks/purity -- three.js is driven imperatively from refs and frame callbacks; the React Compiler heuristics do not apply here. */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  useCursor,
} from "@react-three/drei";
import type { SlotView } from "@/lib/types";
import { SLOTS } from "@/lib/slots-config";
import { GWagon } from "./GWagon";
import { GltfCar } from "./GltfCar";
import { SlotDecal } from "./SlotDecal";
import { ProjectedDecal } from "./ProjectedDecal";
import { snapSlotsToCar, type SnappedPlacement } from "./snap";

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

const MODEL_URL = process.env.NEXT_PUBLIC_CAR_MODEL_URL ?? "/models/g63.glb";
const USE_GLTF = MODEL_URL !== "procedural";

export type ViewPreset = "hero" | "front" | "side" | "rear" | "top" | "inside";

export interface CameraCommand {
  nonce: number;
  type: "preset" | "focus" | "zoom";
  preset?: ViewPreset;
  slotId?: string;
  /** Multiplier on camera distance for zoom commands (0.8 = closer). */
  factor?: number;
}

const TARGET = new THREE.Vector3(0.05, 1.05, 0);
const PRESETS: Record<ViewPreset, { position: [number, number, number]; target?: [number, number, number] }> = {
  hero: { position: [6.0, 2.35, 5.75] },
  front: { position: [9.0, 2.2, 2.4] },
  side: { position: [0.9, 2.0, 9.4] },
  rear: { position: [-8.8, 2.6, -3.0] },
  top: { position: [0.8, 10.5, 0.6] },
  inside: { position: [-0.15, 1.3, -0.3], target: [1.6, 1.1, 0.05] },
};

interface Props {
  slots: SlotView[];
  selectedId: string | null;
  highlightId?: string | null;
  command?: CameraCommand | null;
  /** True while a dialog is open: no idle orbit, no wheel capture. */
  paused?: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Pointer is over the car body (wheel zoom is live). */
  onCarHover?: (over: boolean) => void;
  onReady?: () => void;
  onInteract?: () => void;
}

function Ready({ onReady }: { onReady?: () => void }) {
  // Rendered inside Suspense: mounting means every async asset resolved. We
  // report on the first painted frame so the loader never lifts too early.
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady?.();
  });
  return null;
}

/** Eased camera flights for presets, slot focus and button zoom, plus the idle turntable. */
function CameraRig({
  command,
  controls,
  placements,
  paused,
  onIdle,
}: {
  command?: CameraCommand | null;
  controls: React.RefObject<OrbitControlsImpl | null>;
  placements: Record<string, SnappedPlacement>;
  paused?: boolean;
  onIdle: (idle: boolean) => void;
}) {
  const { camera, size } = useThree();

  // Narrow viewports (phones) get a tighter initial frame so the car fills the
  // width. Wide viewports shift the projection right so the headline has room
  // without leaving a seam where the canvas would otherwise start.
  const framed = useRef(false);
  useEffect(() => {
    const ctl = controls.current;
    const aspect = size.width / Math.max(1, size.height);
    if (camera instanceof THREE.PerspectiveCamera) {
      if (aspect > 1.3) camera.setViewOffset(size.width, size.height, -size.width * 0.1, 0, size.width, size.height);
      else camera.clearViewOffset();
    }
    if (framed.current || !ctl) return;
    framed.current = true;
    if (aspect < 1) {
      camera.position.set(...(PRESETS.hero.position.map((v) => v * 0.78) as [number, number, number]));
      ctl.update();
    }
  }, [camera, controls, size.width, size.height]);

  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t: number; dur: number } | null>(null);
  const lastNonce = useRef(0);
  // 0 = "never touched", so the turntable runs from the first frame.
  const lastTouch = useRef(0);
  const idleRef = useRef(false);

  // The controls ref is attached after this component's mount effect runs, so
  // wire the interaction listener lazily from the frame loop.
  const wired = useRef<OrbitControlsImpl | null>(null);
  const touch = useCallback(() => {
    lastTouch.current = Date.now();
  }, []);
  useEffect(() => () => wired.current?.removeEventListener("start", touch), [touch]);

  useEffect(() => {
    const ctl = controls.current;
    if (!command || command.nonce === lastNonce.current || !ctl) return;
    lastNonce.current = command.nonce;
    lastTouch.current = Date.now();
    const from = camera.position.clone();
    const tFrom = ctl.target.clone();
    const { to, tTo } = resolveCommand(command, from, tFrom, ctl, placements);
    anim.current = { from, to, tFrom, tTo, t: 0, dur: command.type === "zoom" ? 0.35 : 1.1 };
  }, [command, camera, controls, placements]);

  useFrame((_, dt) => {
    const ctl = controls.current;
    if (!ctl) return;
    if (wired.current !== ctl) {
      wired.current?.removeEventListener("start", touch);
      ctl.addEventListener("start", touch);
      wired.current = ctl;
      if (process.env.NODE_ENV !== "production") (window as unknown as { __ctl?: OrbitControlsImpl }).__ctl = ctl;
    }
    const idle = Date.now() - lastTouch.current > 6000 && !anim.current && !paused;
    if (idle !== idleRef.current) {
      idleRef.current = idle;
      onIdle(idle);
    }
    if (idle) {
      // OrbitControls only advances the turntable inside update(); with the
      // prop as source of truth it can miss a frame, so nudge it here too.
      ctl.autoRotate = true;
      ctl.update();
    }
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / a.dur);
    const k = 1 - Math.pow(1 - a.t, 3); // ease-out cubic
    camera.position.lerpVectors(a.from, a.to, k);
    ctl.target.lerpVectors(a.tFrom, a.tTo, k);
    ctl.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

function resolveCommand(
  command: CameraCommand,
  from: THREE.Vector3,
  tFrom: THREE.Vector3,
  ctl: OrbitControlsImpl,
  placements: Record<string, SnappedPlacement>,
): { to: THREE.Vector3; tTo: THREE.Vector3 } {
  if (command.type === "preset" && command.preset) {
    const p = PRESETS[command.preset];
    return { to: new THREE.Vector3(...p.position), tTo: p.target ? new THREE.Vector3(...p.target) : TARGET.clone() };
  }
  if (command.type === "focus" && command.slotId) {
    const def = SLOTS.find((s) => s.id === command.slotId);
    const placed = placements[command.slotId];
    if (def) {
      const pos = new THREE.Vector3(...(placed?.position ?? def.position));
      const rot = new THREE.Euler(...(placed?.rotation ?? def.rotation));
      const normal = new THREE.Vector3(0, 0, 1).applyEuler(rot).normalize();
      const interior = def.zone === "interior";
      const dist = interior ? 1.1 : Math.max(2.6, Math.max(def.size[0], def.size[1]) * 4.5);
      const to = pos.clone().addScaledVector(normal, dist);
      if (!interior) to.y += dist * 0.28;
      return { to, tTo: pos };
    }
  }
  if (command.type === "zoom" && command.factor) {
    const dir = from.clone().sub(tFrom);
    const len = THREE.MathUtils.clamp(dir.length() * command.factor, ctl.minDistance, ctl.maxDistance);
    return { to: tFrom.clone().add(dir.normalize().multiplyScalar(len)), tTo: tFrom.clone() };
  }
  return { to: from.clone(), tTo: tFrom.clone() };
}

function Scene({ slots, selectedId, highlightId, command, paused, onSelect, onHover, onCarHover, onReady, onInteract }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useCursor(hoveredId !== null);
  const controls = useRef<OrbitControlsImpl>(null);
  const [car, setCar] = useState<THREE.Object3D | null>(null);
  const onCarLoaded = useCallback((root: THREE.Object3D) => setCar(root), []);
  const [overCar, setOverCar] = useState(false);
  const [idle, setIdle] = useState(true);
  const [touch] = useState(() => typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);

  const snapped = useMemo(() => {
    if (!car) return {};
    return snapSlotsToCar(car, SLOTS);
  }, [car]);

  const handleHover = (id: string | null) => {
    setHoveredId(id);
    onHover?.(id);
  };

  return (
    <>
      <color attach="background" args={["#07080b"]} />
      <fog attach="fog" args={["#07080b", 16, 34]} />

      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#aebfe6", "#14171f", 0.8]} />
      <spotLight position={[5, 9, 4]} angle={0.5} penumbra={0.6} intensity={200} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} />
      <spotLight position={[-6, 7, -5]} angle={0.6} penumbra={0.8} intensity={120} color="#9fb4ff" />
      <pointLight position={[0, 3, 8]} intensity={40} color="#dfe6f5" />
      <Environment resolution={512}>
        <Lightformer form="rect" intensity={3.5} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-7, 3, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2.5, 1]} color="#9fb4ff" />
        <Lightformer form="rect" intensity={2.5} position={[7, 3, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2.5, 1]} />
        <Lightformer form="ring" intensity={3} position={[0, 2, -8]} scale={[4, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.5} position={[0, 1.5, 8]} rotation={[0, Math.PI, 0]} scale={[8, 2, 1]} color="#e8edf7" />
      </Environment>

      {/* Invisible volume around the car: hovering it turns the wheel into zoom, leaving it lets the page scroll. */}
      <mesh
        position={[0, 1.0, 0]}
        onPointerOver={() => {
          setOverCar(true);
          onCarHover?.(true);
        }}
        onPointerOut={() => {
          setOverCar(false);
          onCarHover?.(false);
        }}
      >
        <boxGeometry args={[5.2, 2.3, 2.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group>
        {USE_GLTF ? <GltfCar url={MODEL_URL} onLoaded={onCarLoaded} /> : <GWagon />}
        {slots.map((s) =>
          snapped[s.id] ? (
            <ProjectedDecal
              key={s.id}
              slot={s}
              placement={snapped[s.id]}
              hovered={hoveredId === s.id || highlightId === s.id}
              selected={selectedId === s.id}
              onHover={handleHover}
              onSelect={onSelect}
            />
          ) : USE_GLTF ? null : (
            <SlotDecal
              key={s.id}
              slot={s}
              hovered={hoveredId === s.id || highlightId === s.id}
              selected={selectedId === s.id}
              onHover={handleHover}
              onSelect={onSelect}
            />
          ),
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 96]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={30}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#0a0c11"
          metalness={0.6}
          mirror={0}
        />
      </mesh>
      <ContactShadows position={[0, 0.003, 0]} opacity={0.9} scale={14} blur={2.2} far={2.5} color="#000000" />
      <group position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[1.35, -1.35].map((z) => (
          <mesh key={z} position={[0, z, 0]}>
            <planeGeometry args={[5.6, 0.06]} />
            <meshBasicMaterial color="#2a3142" />
          </mesh>
        ))}
        <mesh position={[-2.8, 0, 0]}>
          <planeGeometry args={[0.06, 2.76]} />
          <meshBasicMaterial color="#2a3142" />
        </mesh>
      </group>

      <Ready onReady={onReady} />
      <CameraRig command={command} controls={controls} placements={snapped} paused={paused} onIdle={setIdle} />
      <OrbitControls
        ref={controls}
        makeDefault
        target={TARGET.toArray() as [number, number, number]}
        enablePan={false}
        enableZoom={(overCar || touch) && !paused}
        minDistance={0.35}
        maxDistance={18}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.04}
        rotateSpeed={0.55}
        zoomSpeed={1.6}
        autoRotate={idle}
        autoRotateSpeed={0.6}
        onStart={() => onInteract?.()}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export function CarScene(props: Props) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: PRESETS.hero.position, fov: 35, near: 0.05, far: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.25 }}
      className="touch-none"
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
