"use client";

import { Suspense, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
  useCursor,
} from "@react-three/drei";
import type { SlotView } from "@/lib/types";
import { GWagon } from "./GWagon";
import { SlotDecal } from "./SlotDecal";

interface Props {
  slots: SlotView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function Scene({ slots, selectedId, onSelect, onHover }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useCursor(hoveredId !== null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  const handleHover = (id: string | null) => {
    setHoveredId(id);
    onHover?.(id);
  };

  return (
    <>
      <color attach="background" args={["#07080b"]} />
      <fog attach="fog" args={["#07080b", 14, 30]} />

      <ambientLight intensity={1.0} />
      <hemisphereLight args={["#9db0e0", "#1a1f2a", 1.2] } />
      <directionalLight
        position={[6, 9, 4]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-7, 5, -5]} intensity={1.4} color="#9fb4ff" />
      <directionalLight position={[0, 4, 9]} intensity={1.0} color="#ffe6c8" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} color="#9fb4ff" />
        <Lightformer form="rect" intensity={1.2} position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} />
      </Environment>

      <group>
        <GWagon />
        {slots.map((s) => (
          <SlotDecal
            key={s.id}
            slot={s}
            hovered={hoveredId === s.id}
            selected={selectedId === s.id}
            onHover={handleHover}
            onSelect={onSelect}
          />
        ))}
      </group>

      <ContactShadows position={[0, 0.002, 0]} opacity={0.75} scale={14} blur={2.4} far={2.5} color="#000000" />
      <Grid
        position={[0, 0.001, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1b2030"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#2c3548"
        fadeDistance={22}
        fadeStrength={1.5}
        infiniteGrid
      />

      <OrbitControls
        ref={controls}
        makeDefault
        target={[0, 0.95, 0]}
        enablePan={false}
        minDistance={4.2}
        maxDistance={13}
        maxPolarAngle={Math.PI / 2 - 0.04}
        autoRotate
        autoRotateSpeed={0.5}
        onStart={() => {
          if (controls.current) controls.current.autoRotate = false;
        }}
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
      camera={{ position: [6.8, 3.0, 6.4], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.25 }}
      className="touch-none"
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
