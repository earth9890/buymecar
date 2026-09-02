"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

/**
 * Procedural Mercedes-AMG G63. Real dimensions, metres, car faces +X.
 *   length 4.87  width 1.98 (body 1.90)  height 1.97  wheelbase 2.89  tyre ⌀ 0.80
 * Body panels are rounded boxes; the slot decals in slots-config sit on the
 * flat faces at z = ±0.962, y = 1.436 (hood), y = 1.956 (roof), x = ±2.3/2.476.
 */
export function GWagon() {
  const m = useMemo(() => {
    const paint = new THREE.MeshPhysicalMaterial({
      color: "#454c5a",
      metalness: 0.6,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const trim = new THREE.MeshStandardMaterial({ color: "#121419", metalness: 0.2, roughness: 0.75 });
    const gloss = new THREE.MeshStandardMaterial({ color: "#0b0d11", metalness: 0.5, roughness: 0.2 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#0f1a2b",
      metalness: 0.7,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    });
    const chrome = new THREE.MeshStandardMaterial({ color: "#d8dde6", metalness: 1, roughness: 0.15 });
    const tire = new THREE.MeshStandardMaterial({ color: "#15171b", roughness: 0.92 });
    const rim = new THREE.MeshStandardMaterial({ color: "#2b3039", metalness: 0.9, roughness: 0.3 });
    const rimLip = new THREE.MeshStandardMaterial({ color: "#c9ced8", metalness: 1, roughness: 0.2 });
    const lamp = new THREE.MeshStandardMaterial({ color: "#eef3ff", emissive: "#cfe0ff", emissiveIntensity: 2.2, roughness: 0.15 });
    const drl = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 3 });
    const amber = new THREE.MeshStandardMaterial({ color: "#ffb02e", emissive: "#ff9a00", emissiveIntensity: 1.2 });
    const red = new THREE.MeshStandardMaterial({ color: "#ff2a3c", emissive: "#ff1a2e", emissiveIntensity: 1.4 });
    const caliper = new THREE.MeshStandardMaterial({ color: "#d61f2c", metalness: 0.4, roughness: 0.4 });
    return { paint, trim, gloss, glass, chrome, tire, rim, rimLip, lamp, drl, amber, red, caliper };
  }, []);

  const WHEEL_X = 1.445;
  const WHEEL_Z = 0.83;
  const WHEEL_R = 0.4;
  const wheels: [number, number][] = [
    [WHEEL_X, WHEEL_Z],
    [WHEEL_X, -WHEEL_Z],
    [-WHEEL_X, WHEEL_Z],
    [-WHEEL_X, -WHEEL_Z],
  ];

  return (
    <group>
      {/* ---------- chassis & underbody ---------- */}
      <mesh position={[0, 0.48, 0]} material={m.trim}>
        <boxGeometry args={[4.1, 0.16, 1.55]} />
      </mesh>
      {/* AMG side exhausts, one per side, in front of the rear wheels */}
      {[1, -1].map((s) => (
        <group key={s} position={[-0.55, 0.5, s * 0.95]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={m.chrome}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 20]} />
          </mesh>
          <mesh position={[0, -0.26, 0]} material={m.chrome}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 20]} />
          </mesh>
        </group>
      ))}

      {/* ---------- lower body ---------- */}
      <RoundedBox args={[4.6, 0.8, 1.9]} radius={0.05} smoothness={4} position={[0, 0.95, 0]} material={m.paint} castShadow receiveShadow />
      {/* beltline crease */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.05, 1.335, s * 0.955]} material={m.gloss}>
          <boxGeometry args={[4.5, 0.03, 0.02]} />
        </mesh>
      ))}
      {/* door seams */}
      {[1, -1].flatMap((s) =>
        [1.05, -0.02, -1.28].map((x) => (
          <mesh key={`${s}${x}`} position={[x, 1.0, s * 0.955]} material={m.gloss}>
            <boxGeometry args={[0.015, 0.68, 0.015]} />
          </mesh>
        )),
      )}
      {/* door handles */}
      {[1, -1].flatMap((s) =>
        [0.85, -0.22].map((x) => (
          <mesh key={`${s}${x}`} position={[x, 1.24, s * 0.965]} material={m.chrome}>
            <boxGeometry args={[0.16, 0.035, 0.03]} />
          </mesh>
        )),
      )}

      {/* ---------- greenhouse ---------- */}
      <RoundedBox args={[3.5, 0.62, 1.8]} radius={0.04} smoothness={4} position={[-0.55, 1.65, 0]} material={m.paint} castShadow receiveShadow />
      {/* roof drip rails */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.55, 1.95, s * 0.9]} material={m.gloss}>
          <boxGeometry args={[3.5, 0.03, 0.04]} />
        </mesh>
      ))}
      {/* side glass, recessed with pillars */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.55, 1.66, s * 0.905]} material={m.glass}>
          <boxGeometry args={[3.3, 0.42, 0.012]} />
        </mesh>
      ))}
      {[-0.02, -1.28].flatMap((x) =>
        [1, -1].map((s) => (
          <mesh key={`${x}${s}`} position={[x, 1.66, s * 0.914]} material={m.paint}>
            <boxGeometry args={[0.09, 0.44, 0.012]} />
          </mesh>
        )),
      )}
      {/* windshield + wiper base, rear glass */}
      <mesh position={[1.206, 1.66, 0]} material={m.glass}>
        <boxGeometry args={[0.012, 0.44, 1.62]} />
      </mesh>
      <mesh position={[1.22, 1.43, 0]} material={m.gloss}>
        <boxGeometry args={[0.06, 0.05, 1.7]} />
      </mesh>
      <mesh position={[-2.306, 1.66, 0]} material={m.glass}>
        <boxGeometry args={[0.012, 0.44, 1.62]} />
      </mesh>

      {/* ---------- hood ---------- */}
      <RoundedBox args={[1.12, 0.1, 1.82]} radius={0.03} smoothness={4} position={[1.7, 1.39, 0]} material={m.paint} castShadow />
      {/* iconic hood-top indicators */}
      {[1, -1].map((s) => (
        <group key={s} position={[2.17, 1.47, s * 0.8]}>
          <mesh material={m.trim}>
            <boxGeometry args={[0.2, 0.07, 0.13]} />
          </mesh>
          <mesh position={[0.02, 0.005, 0]} material={m.amber}>
            <boxGeometry args={[0.17, 0.05, 0.1]} />
          </mesh>
        </group>
      ))}

      {/* ---------- roof rack ---------- */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[-0.55, 2.02, s * 0.84]} material={m.trim}>
            <boxGeometry args={[3.0, 0.045, 0.045]} />
          </mesh>
          {[-1.9, -0.55, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.985, s * 0.84]} material={m.trim}>
              <boxGeometry args={[0.1, 0.05, 0.045]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---------- fender flares ---------- */}
      {wheels.map(([x, z]) => (
        <group key={`flare${x}${z}`} position={[x, 0.86, Math.sign(z) * 0.98]}>
          <RoundedBox args={[1.05, 0.34, 0.14]} radius={0.05} smoothness={3} material={m.trim} castShadow />
          <mesh position={[0, -0.16, 0]} material={m.trim}>
            <boxGeometry args={[1.05, 0.04, 0.16]} />
          </mesh>
        </group>
      ))}

      {/* ---------- running boards ---------- */}
      {[1, -1].map((s) => (
        <group key={s} position={[-0.1, 0.5, s * 1.03]}>
          <mesh material={m.trim}>
            <boxGeometry args={[2.5, 0.05, 0.2]} />
          </mesh>
          <mesh position={[0, 0.03, s * -0.02]} material={m.chrome}>
            <boxGeometry args={[2.4, 0.01, 0.12]} />
          </mesh>
        </group>
      ))}

      {/* ---------- mirrors ---------- */}
      {[1, -1].map((s) => (
        <group key={s} position={[1.02, 1.47, s * 1.03]}>
          <mesh position={[0, 0, s * -0.1]} material={m.trim}>
            <boxGeometry args={[0.05, 0.05, 0.14]} />
          </mesh>
          <RoundedBox args={[0.11, 0.15, 0.24]} radius={0.03} material={m.paint} />
        </group>
      ))}

      {/* ---------- front end ---------- */}
      {/* grille surround + vertical AMG slats */}
      <mesh position={[2.31, 1.08, 0]} material={m.trim}>
        <boxGeometry args={[0.03, 0.4, 1.16]} />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => -0.48 + i * 0.08).map((z) => (
        <mesh key={z} position={[2.33, 1.08, z]} material={m.chrome}>
          <boxGeometry args={[0.02, 0.32, 0.02]} />
        </mesh>
      ))}
      <mesh position={[2.335, 1.08, 0]} material={m.chrome}>
        <boxGeometry args={[0.02, 0.05, 1.1]} />
      </mesh>
      {/* star badge */}
      <mesh position={[2.35, 1.08, 0]} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
        <torusGeometry args={[0.07, 0.012, 8, 32]} />
      </mesh>
      {/* headlights: chrome bezel, lamp, LED ring */}
      {[1, -1].map((s) => (
        <group key={s} position={[2.315, 1.1, s * 0.72]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={m.chrome}>
            <cylinderGeometry args={[0.185, 0.185, 0.03, 40]} />
          </mesh>
          <mesh position={[0, -0.016, 0]} material={m.lamp}>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 40]} />
          </mesh>
          <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.drl}>
            <torusGeometry args={[0.165, 0.008, 8, 48]} />
          </mesh>
        </group>
      ))}
      {/* bumper with skid plate and fog lights */}
      <RoundedBox args={[0.25, 0.28, 1.95]} radius={0.04} smoothness={3} position={[2.35, 0.62, 0]} material={m.trim} castShadow />
      <mesh position={[2.47, 0.52, 0]} material={m.chrome}>
        <boxGeometry args={[0.02, 0.06, 0.9]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[2.478, 0.68, s * 0.7]} rotation={[0, 0, Math.PI / 2]} material={m.lamp}>
          <cylinderGeometry args={[0.05, 0.05, 0.01, 24]} />
        </mesh>
      ))}
      {/* license plate */}
      <mesh position={[2.478, 0.72, 0]} material={m.chrome}>
        <boxGeometry args={[0.01, 0.12, 0.5]} />
      </mesh>

      {/* ---------- rear end ---------- */}
      <RoundedBox args={[0.25, 0.28, 1.95]} radius={0.04} smoothness={3} position={[-2.35, 0.62, 0]} material={m.trim} castShadow />
      {/* tail lights */}
      {[1, -1].map((s) => (
        <group key={s} position={[-2.31, 1.2, s * 0.8]}>
          <mesh material={m.trim}>
            <boxGeometry args={[0.03, 0.24, 0.17]} />
          </mesh>
          <mesh position={[-0.005, 0.03, 0]} material={m.red}>
            <boxGeometry args={[0.03, 0.12, 0.14]} />
          </mesh>
          <mesh position={[-0.005, -0.07, 0]} material={m.amber}>
            <boxGeometry args={[0.03, 0.05, 0.14]} />
          </mesh>
        </group>
      ))}
      {/* rear door seam + hinge line */}
      <mesh position={[-2.305, 1.0, -0.2]} material={m.gloss}>
        <boxGeometry args={[0.012, 0.7, 0.015]} />
      </mesh>
      {/* spare wheel with hard cover */}
      <mesh position={[-2.33, 1.1, 0.3]} material={m.trim}>
        <boxGeometry args={[0.08, 0.5, 0.5]} />
      </mesh>
      <group position={[-2.43, 1.1, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={m.tire} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.25, 48]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} material={m.paint}>
          <cylinderGeometry args={[0.37, 0.37, 0.012, 48]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome}>
          <torusGeometry args={[0.37, 0.008, 8, 48]} />
        </mesh>
      </group>

      {/* ---------- wheels ---------- */}
      {wheels.map(([x, z]) => (
        <group key={`wheel${x}${z}`} position={[x, WHEEL_R, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={m.tire} castShadow>
            <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.32, 48]} />
          </mesh>
          {/* rim face + lip */}
          <mesh material={m.rim}>
            <cylinderGeometry args={[0.29, 0.29, 0.33, 32]} />
          </mesh>
          <mesh position={[0, z > 0 ? 0.166 : -0.166, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.rimLip}>
            <torusGeometry args={[0.285, 0.012, 8, 48]} />
          </mesh>
          {/* five spokes */}
          {Array.from({ length: 5 }, (_, i) => (i * Math.PI * 2) / 5).map((a) => (
            <mesh
              key={a}
              position={[Math.cos(a) * 0.14, z > 0 ? 0.168 : -0.168, Math.sin(a) * 0.14]}
              rotation={[0, -a, 0]}
              material={m.rimLip}
            >
              <boxGeometry args={[0.26, 0.014, 0.085]} />
            </mesh>
          ))}
          <mesh position={[0, z > 0 ? 0.17 : -0.17, 0]} material={m.chrome}>
            <cylinderGeometry args={[0.06, 0.06, 0.012, 24]} />
          </mesh>
          {/* brake disc + red caliper visible through the spokes */}
          <mesh material={m.chrome}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
          </mesh>
          <mesh position={[0.12, 0, 0.14]} material={m.caliper}>
            <boxGeometry args={[0.1, 0.05, 0.14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
