"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { SlotView } from "@/lib/types";
import { formatUsd } from "@/lib/pricing";
import { brandColor, hostOf, readableTextColor } from "./materials";

interface Props {
  slot: SlotView;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export function SlotDecal({ slot, hovered, selected, onHover, onSelect }: Props) {
  const [w, h] = slot.size;
  const owned = Boolean(slot.owner);
  const color = owned ? brandColor(slot.owner!.brandName) : "#c9d1de";
  const textColor = owned ? readableTextColor(color) : "#ffffff";
  const thin = h <= 0.22;

  const circle = slot.shape === "circle";
  const geometry = useMemo(
    () => (circle ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, h)),
    [circle, w, h],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, circle ? 1 : 1), [geometry, circle]);
  // Text has to fit inside the inscribed square of a circle.
  const tw = circle ? w * 0.72 : w;

  // Available panels show only the price; owned panels show the brand.
  const primary = owned ? slot.owner!.brandName.toUpperCase() : formatUsd(slot.minBidCents);
  const secondary = owned ? slot.owner!.tagline || hostOf(slot.owner!.url) : null;

  // Font sizing: fit the primary line to the panel width, capped by height.
  const primarySize = thin
    ? h * 0.62
    : secondary
      ? Math.min(h * 0.34, (tw * 1.3) / Math.max(primary.length, 5))
      : Math.min(h * 0.5, (tw * 1.4) / Math.max(primary.length, 4));
  const secondarySize = secondary
    ? thin
      ? h * 0.5
      : Math.min(h * 0.2, (tw * 1.3) / Math.max(secondary.length, 8))
    : 0;

  const active = hovered || selected;

  return (
    <group position={slot.position} rotation={slot.rotation}>
      <mesh
        geometry={geometry}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(slot.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          // Ignore "clicks" that were really the end of an orbit drag.
          if (e.delta > 6) return;
          onSelect(slot.id);
        }}
      >
        <meshStandardMaterial
          color={color}
          transparent={!owned}
          opacity={owned ? 1 : active ? 0.65 : 0.3}
          emissive={color}
          emissiveIntensity={active ? (owned ? 0.5 : 0.35) : owned ? 0.12 : 0.04}
          roughness={0.9}
          metalness={0}
          envMapIntensity={0.25}
          side={THREE.FrontSide}
        />
      </mesh>
      <lineSegments geometry={edges} position={[0, 0, 0.003]}>
        <lineBasicMaterial color={active ? "#ffffff" : owned ? textColor : "#ffffff"} transparent opacity={active ? 1 : 0.55} />
      </lineSegments>

      {thin ? (
        <Text
          position={[0, 0, 0.012]}
          depthOffset={-4}
          fontSize={primarySize}
          maxWidth={tw * 0.95}
          anchorX="center"
          anchorY="middle"
          color={textColor}
          letterSpacing={0.08}
        >
          {secondary ? `${primary}  ·  ${secondary}` : primary}
        </Text>
      ) : (
        <>
          <Text
            position={[0, secondary ? h * 0.12 : 0, 0.012]}
            depthOffset={-4}
            fontSize={primarySize}
            maxWidth={tw * 0.92}
            anchorX="center"
            anchorY="middle"
            color={textColor}
            letterSpacing={0.06}
            textAlign="center"
          >
            {primary}
          </Text>
          {secondary && (
          <Text
            position={[0, -h * 0.22, 0.012]}
            depthOffset={-4}
            fontSize={secondarySize}
            maxWidth={tw * 0.9}
            anchorX="center"
            anchorY="middle"
            color={textColor}
            fillOpacity={0.85}
            textAlign="center"
          >
            {secondary}
          </Text>
          )}
        </>
      )}
    </group>
  );
}
