"use client";

import type { Material } from "three";

/**
 * Three-pointed star in a ring. Faces +Z; rotate the group to aim it.
 * radius = outer ring radius, in metres.
 */
export function MercedesStar({
  radius,
  material,
  depth = 0.012,
}: {
  radius: number;
  material: Material;
  depth?: number;
}) {
  const tube = radius * 0.09;
  const spoke = radius * 0.16;
  return (
    <group>
      <mesh material={material}>
        <torusGeometry args={[radius - tube, tube, 10, 48]} />
      </mesh>
      {[Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3].map((a) => (
        <mesh
          key={a}
          material={material}
          position={[Math.cos(a) * (radius - tube) * 0.5, Math.sin(a) * (radius - tube) * 0.5, 0]}
          rotation={[0, 0, a]}
        >
          <boxGeometry args={[radius - tube, spoke, depth]} />
        </mesh>
      ))}
      <mesh material={material}>
        <cylinderGeometry args={[spoke * 0.7, spoke * 0.7, depth, 16]} />
      </mesh>
    </group>
  );
}
