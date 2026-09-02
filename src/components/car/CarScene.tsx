"use client";

import { Suspense, useEffect, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
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
  /** Fires once the scene (env map, fonts, floor) has actually rendered. */
  onReady?: () => void;
}

function Ready({ onReady }: { onReady?: () => void }) {
  // Rendered inside Suspense: mounting means every async asset resolved.
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function Scene({ slots, selectedId, onSelect, onHover, onReady }: Props) {
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

      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#aebfe6", "#14171f", 0.8]} />
      <spotLight
        position={[5, 9, 4]}
        angle={0.5}
        penumbra={0.6}
        intensity={260}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      <spotLight position={[-6, 7, -5]} angle={0.6} penumbra={0.8} intensity={120} color="#9fb4ff" />
      <pointLight position={[0, 3, 8]} intensity={40} color="#ffe6c8" />
      {/* Studio softboxes baked into an env map: no network fetch, sharp reflections on the paint */}
      <Environment resolution={512}>
        <Lightformer form="rect" intensity={6} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-7, 3, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2.5, 1]} color="#9fb4ff" />
        <Lightformer form="rect" intensity={2.5} position={[7, 3, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2.5, 1]} />
        <Lightformer form="ring" intensity={3} position={[0, 2, -8]} scale={[4, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.5} position={[0, 1.5, 8]} rotation={[0, Math.PI, 0]} scale={[8, 2, 1]} color="#ffe6c8" />
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

      {/* showroom floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
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
      {/* parking-spot lines under the car */}
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
      camera={{ position: [6.4, 2.6, 6.2], fov: 36, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.25 }}
      className="touch-none"
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
