"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { ThreeEvent } from "@react-three/fiber";
import type { SlotView } from "@/lib/types";
import type { SnappedPlacement } from "./snap";
import { drawSlotTexture } from "./decal-texture";

interface Props {
  slot: SlotView;
  placement: SnappedPlacement;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/**
 * A slot rendered as a real decal: the panel texture is projected onto the
 * car mesh it landed on and clipped to the slot box, so it wraps curves and
 * never overflows an edge.
 */
export function ProjectedDecal({ slot, placement, hovered, selected, onHover, onSelect }: Props) {
  const [w, h] = slot.size;
  const depth = slot.snap?.depth ?? 0.2;

  const geometry = useMemo(() => {
    const pos = new THREE.Vector3(...placement.position);
    const rot = new THREE.Euler(...placement.rotation);
    return new DecalGeometry(placement.object, pos, rot, new THREE.Vector3(w, h, depth));
  }, [placement, w, h, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const active = hovered || selected;
  const texture = useMemo(() => drawSlotTexture(slot, active), [slot, active]);
  useEffect(() => () => texture.dispose(), [texture]);

  const flat = slot.snap?.flat ?? false;
  const flatGeometry = useMemo(
    () => (flat ? (slot.shape === "circle" ? new THREE.CircleGeometry(w / 2, 64) : new THREE.PlaneGeometry(w, h)) : null),
    [flat, slot.shape, w, h],
  );
  useEffect(() => () => flatGeometry?.dispose(), [flatGeometry]);

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(slot.id);
    },
    onPointerOut: () => onHover(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > 6) return;
      onSelect(slot.id);
    },
  };

  const material = (
    <meshStandardMaterial
      map={texture}
      transparent
      roughness={0.6}
      metalness={0}
      envMapIntensity={0.35}
      polygonOffset
      polygonOffsetFactor={-6}
      polygonOffsetUnits={-2}
      depthWrite={false}
      side={THREE.FrontSide}
    />
  );

  if (flat && flatGeometry) {
    return (
      <mesh geometry={flatGeometry} position={placement.position} rotation={placement.rotation} renderOrder={2} {...handlers}>
        {material}
      </mesh>
    );
  }
  return (
    <mesh geometry={geometry} renderOrder={2} {...handlers}>
      {material}
    </mesh>
  );
}
