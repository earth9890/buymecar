"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Procedural low-poly Mercedes-AMG G63. The real thing is famously a box on
 * wheels, which makes it the one supercar you can convincingly build from
 * primitives. Dimensions in metres; car faces +X.
 */
export function GWagon() {
  const mats = useMemo(() => {
    const paint = new THREE.MeshStandardMaterial({
      color: "#343b49",
      metalness: 0.55,
      roughness: 0.3,
    });
    const trim = new THREE.MeshStandardMaterial({ color: "#14171d", metalness: 0.3, roughness: 0.65 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#1d2b45",
      metalness: 0.6,
      roughness: 0.05,
      transmission: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    const chrome = new THREE.MeshStandardMaterial({ color: "#cfd4dc", metalness: 1, roughness: 0.18 });
    const tire = new THREE.MeshStandardMaterial({ color: "#1a1d22", roughness: 0.95 });
    const rim = new THREE.MeshStandardMaterial({ color: "#b9bec7", metalness: 0.95, roughness: 0.25 });
    const lamp = new THREE.MeshStandardMaterial({
      color: "#f4f7ff",
      emissive: "#dfe9ff",
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const amber = new THREE.MeshStandardMaterial({
      color: "#ffb02e",
      emissive: "#ff9a00",
      emissiveIntensity: 0.9,
    });
    const red = new THREE.MeshStandardMaterial({
      color: "#ff2a3c",
      emissive: "#ff1a2e",
      emissiveIntensity: 1.1,
    });
    return { paint, trim, glass, chrome, tire, rim, lamp, amber, red };
  }, []);

  const wheelPositions: [number, number, number][] = [
    [1.5, 0.42, 0.85],
    [1.5, 0.42, -0.85],
    [-1.5, 0.42, 0.85],
    [-1.5, 0.42, -0.85],
  ];

  return (
    <group>
      {/* chassis */}
      <mesh position={[0, 0.5, 0]} material={mats.trim} castShadow>
        <boxGeometry args={[4.0, 0.15, 1.5]} />
      </mesh>

      {/* lower body */}
      <mesh position={[0, 0.95, 0]} material={mats.paint} castShadow receiveShadow>
        <boxGeometry args={[4.6, 0.8, 1.9]} />
      </mesh>

      {/* greenhouse */}
      <mesh position={[-0.55, 1.65, 0]} material={mats.paint} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.6, 1.8]} />
      </mesh>

      {/* glass: sides, windshield, rear */}
      {[0.906, -0.906].map((z) => (
        <mesh key={z} position={[-0.55, 1.66, z]} material={mats.glass}>
          <boxGeometry args={[3.3, 0.42, 0.012]} />
        </mesh>
      ))}
      <mesh position={[1.205, 1.66, 0]} material={mats.glass}>
        <boxGeometry args={[0.012, 0.42, 1.6]} />
      </mesh>
      <mesh position={[-2.305, 1.66, 0]} material={mats.glass}>
        <boxGeometry args={[0.012, 0.42, 1.6]} />
      </mesh>
      {/* pillars over the side glass */}
      {[-0.15, -1.35].flatMap((x) =>
        [0.914, -0.914].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.66, z]} material={mats.paint}>
            <boxGeometry args={[0.08, 0.44, 0.012]} />
          </mesh>
        )),
      )}

      {/* hood */}
      <mesh position={[1.7, 1.39, 0]} material={mats.paint} castShadow>
        <boxGeometry args={[1.1, 0.09, 1.8]} />
      </mesh>
      {/* signature hood-top turn indicators */}
      {[0.82, -0.82].map((z) => (
        <mesh key={z} position={[2.2, 1.465, z]} material={mats.amber}>
          <boxGeometry args={[0.16, 0.06, 0.1]} />
        </mesh>
      ))}

      {/* roof rails */}
      {[0.86, -0.86].map((z) => (
        <group key={z}>
          <mesh position={[-0.55, 2.01, z]} material={mats.trim}>
            <boxGeometry args={[3.0, 0.05, 0.05]} />
          </mesh>
          {[-1.9, -0.55, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.975, z]} material={mats.trim}>
              <boxGeometry args={[0.1, 0.05, 0.05]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* fender arches */}
      {wheelPositions.map(([x, , z]) => (
        <mesh key={`arch${x}${z}`} position={[x, 0.78, z > 0 ? 0.99 : -0.99]} material={mats.trim} castShadow>
          <boxGeometry args={[0.95, 0.28, 0.14]} />
        </mesh>
      ))}

      {/* running boards */}
      {[1.02, -1.02].map((z) => (
        <mesh key={z} position={[0, 0.5, z]} material={mats.trim}>
          <boxGeometry args={[2.6, 0.06, 0.16]} />
        </mesh>
      ))}

      {/* mirrors */}
      {[1.05, -1.05].map((z) => (
        <mesh key={z} position={[1.0, 1.45, z]} material={mats.paint}>
          <boxGeometry args={[0.12, 0.14, 0.22]} />
        </mesh>
      ))}

      {/* front: grille, slats, headlights, bumper */}
      <mesh position={[2.305, 1.08, 0]} material={mats.trim}>
        <boxGeometry args={[0.02, 0.38, 1.12]} />
      </mesh>
      {[0.98, 1.08, 1.18].map((y) => (
        <mesh key={y} position={[2.318, y, 0]} material={mats.chrome}>
          <boxGeometry args={[0.03, 0.035, 1.06]} />
        </mesh>
      ))}
      {[0.72, -0.72].map((z) => (
        <group key={z} position={[2.312, 1.1, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.chrome}>
            <cylinderGeometry args={[0.17, 0.17, 0.02, 32]} />
          </mesh>
          <mesh position={[0, 0, 0]} material={mats.lamp}>
            <cylinderGeometry args={[0.14, 0.14, 0.03, 32]} />
          </mesh>
        </group>
      ))}
      <mesh position={[2.35, 0.62, 0]} material={mats.trim} castShadow>
        <boxGeometry args={[0.25, 0.26, 1.95]} />
      </mesh>

      {/* rear: bumper, tail lights, spare tire */}
      <mesh position={[-2.35, 0.62, 0]} material={mats.trim} castShadow>
        <boxGeometry args={[0.25, 0.26, 1.95]} />
      </mesh>
      {[0.8, -0.8].map((z) => (
        <mesh key={z} position={[-2.31, 1.2, z]} material={mats.red}>
          <boxGeometry args={[0.02, 0.2, 0.14]} />
        </mesh>
      ))}
      <group position={[-2.43, 1.1, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={mats.tire} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.25, 40]} />
        </mesh>
        {/* hard cover on the outside face */}
        <mesh position={[0, -0.13, 0]} material={mats.paint}>
          <cylinderGeometry args={[0.36, 0.36, 0.01, 40]} />
        </mesh>
      </group>
      {/* spare bracket */}
      <mesh position={[-2.33, 1.1, 0.3]} material={mats.trim}>
        <boxGeometry args={[0.08, 0.5, 0.5]} />
      </mesh>

      {/* wheels */}
      {wheelPositions.map(([x, y, z]) => (
        <group key={`wheel${x}${z}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={mats.tire} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.32, 40]} />
          </mesh>
          <mesh material={mats.rim}>
            <cylinderGeometry args={[0.27, 0.27, 0.33, 24]} />
          </mesh>
          <mesh material={mats.trim}>
            <cylinderGeometry args={[0.07, 0.07, 0.34, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
