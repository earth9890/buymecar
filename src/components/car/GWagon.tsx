"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { MercedesStar } from "./MercedesStar";

/**
 * Mercedes-AMG G63, procedural. Metres, car faces +X, ground at y = 0.
 *   length 4.87  body width 1.90 (1.98 over flares)  height 1.97  wheelbase 2.89
 *
 * Lower body is an extruded side profile with real wheel-arch cutouts and a
 * bevelled edge. The greenhouse is a cage (roof slab + pillars + glass) so the
 * interior is visible and the camera can go inside.
 *
 * Slot decals (slots-config.ts) sit on: side faces z = ±0.95, hood top y = 1.46,
 * roof top y = 1.96, front bumper x = 2.44, rear bumper x = -2.44, tailgate
 * x = -2.30, glass panes, mirror caps z = ±1.20, wheel caps z = ±0.915.
 */

const WHEEL_X = 1.445;
const WHEEL_Z = 0.8;
const WHEEL_Y = 0.41;
const ARCH_R = 0.53;

function bodyProfile(): THREE.Shape {
  // Inset by the bevel size (0.04) so the finished body is 4.6 × 0.83 × 1.9.
  const x0 = -2.26;
  const x1 = 2.26;
  const yb = 0.6;
  const yt = 1.34;
  const r = 0.06;
  const s = new THREE.Shape();
  const dx = Math.sqrt(ARCH_R * ARCH_R - (yb - WHEEL_Y) ** 2);
  const a0 = Math.atan2(yb - WHEEL_Y, -dx);
  const a1 = Math.atan2(yb - WHEEL_Y, dx);

  s.moveTo(x0 + r, yb);
  // rear arch
  s.lineTo(-WHEEL_X - dx, yb);
  s.absarc(-WHEEL_X, WHEEL_Y, ARCH_R, a0, a1, true);
  // front arch
  s.lineTo(WHEEL_X - dx, yb);
  s.absarc(WHEEL_X, WHEEL_Y, ARCH_R, a0, a1, true);
  s.lineTo(x1 - r, yb);
  s.quadraticCurveTo(x1, yb, x1, yb + r);
  s.lineTo(x1, yt - r);
  s.quadraticCurveTo(x1, yt, x1 - r, yt);
  s.lineTo(x0 + r, yt);
  s.quadraticCurveTo(x0, yt, x0, yt - r);
  s.lineTo(x0, yb + r);
  s.quadraticCurveTo(x0, yb, x0 + r, yb);
  return s;
}

export function GWagon() {
  const m = useMemo(() => {
    // Satin black: matte body with a soft clearcoat sheen.
    const paint = new THREE.MeshPhysicalMaterial({
      color: "#0b0c0f",
      metalness: 0.25,
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.4,
    });
    const trim = new THREE.MeshStandardMaterial({ color: "#0e0f12", metalness: 0.1, roughness: 0.85 });
    const gloss = new THREE.MeshPhysicalMaterial({ color: "#05060a", metalness: 0.5, roughness: 0.15, clearcoat: 1 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#101a2a",
      metalness: 0.3,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      envMapIntensity: 1.6,
    });
    const lensGlass = new THREE.MeshPhysicalMaterial({
      color: "#dfe8ff",
      roughness: 0.02,
      transmission: 0,
      transparent: true,
      opacity: 0.35,
      clearcoat: 1,
    });
    const chrome = new THREE.MeshStandardMaterial({ color: "#e2e6ee", metalness: 1, roughness: 0.12 });
    const darkChrome = new THREE.MeshStandardMaterial({ color: "#5a606c", metalness: 1, roughness: 0.25 });
    const tire = new THREE.MeshStandardMaterial({ color: "#141518", roughness: 0.95 });
    const rim = new THREE.MeshStandardMaterial({ color: "#3a3f4a", metalness: 0.85, roughness: 0.3 });
    const rimFace = new THREE.MeshStandardMaterial({ color: "#6b717d", metalness: 0.8, roughness: 0.3 });
    const spoke = new THREE.MeshStandardMaterial({ color: "#c3c8d2", metalness: 0.75, roughness: 0.28 });
    const lamp = new THREE.MeshStandardMaterial({ color: "#f2f6ff", emissive: "#d8e6ff", emissiveIntensity: 2.6, roughness: 0.1 });
    const drl = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 4 });
    const amber = new THREE.MeshStandardMaterial({ color: "#ffb02e", emissive: "#ff9a00", emissiveIntensity: 1.2 });
    const red = new THREE.MeshStandardMaterial({ color: "#ff2a3c", emissive: "#ff1a2e", emissiveIntensity: 1.6 });
    const caliper = new THREE.MeshStandardMaterial({ color: "#c8202c", metalness: 0.4, roughness: 0.4 });
    const leather = new THREE.MeshStandardMaterial({ color: "#1c1c1f", roughness: 0.8 });
    const leatherRed = new THREE.MeshStandardMaterial({ color: "#3a1418", roughness: 0.75 });
    const carpet = new THREE.MeshStandardMaterial({ color: "#0c0c0e", roughness: 1 });
    const screen = new THREE.MeshStandardMaterial({ color: "#0b1830", emissive: "#1c4fa8", emissiveIntensity: 0.9, roughness: 0.2 });
    const woodTrim = new THREE.MeshPhysicalMaterial({ color: "#2a1a12", roughness: 0.3, clearcoat: 1 });
    return { paint, trim, gloss, glass, lensGlass, chrome, darkChrome, tire, rim, rimFace, spoke, lamp, drl, amber, red, caliper, leather, leatherRed, carpet, screen, woodTrim };
  }, []);

  const bodyGeom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bodyProfile(), {
      depth: 1.82,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
      curveSegments: 32,
    });
    g.translate(0, 0, -0.91);
    g.computeVertexNormals();
    return g;
  }, []);

  const wheels: [number, number][] = [
    [WHEEL_X, WHEEL_Z],
    [WHEEL_X, -WHEEL_Z],
    [-WHEEL_X, WHEEL_Z],
    [-WHEEL_X, -WHEEL_Z],
  ];
  const sides = [1, -1] as const;

  return (
    <group>
      {/* ================= chassis ================= */}
      <mesh position={[0, 0.5, 0]} material={m.trim}>
        <boxGeometry args={[4.0, 0.14, 1.5]} />
      </mesh>
      {[WHEEL_X, -WHEEL_X].map((x) => (
        <group key={x}>
          <mesh position={[x, WHEEL_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
            <cylinderGeometry args={[0.05, 0.05, 1.6, 16]} />
          </mesh>
          <mesh position={[x, WHEEL_Y, 0]} material={m.trim}>
            <sphereGeometry args={[0.13, 20, 16]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.44, 0.05]} rotation={[0, 0, Math.PI / 2]} material={m.darkChrome}>
        <cylinderGeometry args={[0.03, 0.03, 2.8, 12]} />
      </mesh>
      {/* AMG side exhausts */}
      {sides.map((s) =>
        [-0.62, -0.84].map((x) => (
          <group key={`${s}${x}`} position={[x, 0.46, s * 0.86]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={m.chrome}>
              <cylinderGeometry args={[0.055, 0.055, 0.3, 24]} />
            </mesh>
            <mesh position={[0, s * 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.gloss}>
              <torusGeometry args={[0.04, 0.012, 8, 24]} />
            </mesh>
          </group>
        )),
      )}

      {/* ================= lower body ================= */}
      <mesh geometry={bodyGeom} material={m.paint} castShadow receiveShadow />
      {/* fender flares: half tori hugging the arch cutouts */}
      {wheels.map(([x, z]) => (
        <mesh
          key={`flare${x}${z}`}
          position={[x, WHEEL_Y, Math.sign(z) * 0.965]}
          rotation={[0, 0, 0]}
          material={m.trim}
          castShadow
        >
          <torusGeometry args={[ARCH_R + 0.03, 0.055, 12, 40, Math.PI]} />
        </mesh>
      ))}
      {/* beltline trim, door seams, handles */}
      {sides.map((s) => (
        <mesh key={s} position={[0, 1.345, s * 0.953]} material={m.gloss}>
          <boxGeometry args={[4.5, 0.025, 0.02]} />
        </mesh>
      ))}
      {sides.flatMap((s) =>
        [1.14, -0.02, -1.28].map((x) => (
          <mesh key={`${s}${x}`} position={[x, 1.0, s * 0.952]} material={m.gloss}>
            <boxGeometry args={[0.012, 0.66, 0.012]} />
          </mesh>
        )),
      )}
      {sides.flatMap((s) =>
        [0.12, -1.15].map((x) => (
          <group key={`${s}${x}`} position={[x, 1.22, s * 0.955]}>
            <mesh position={[0, 0, s * -0.005]} material={m.trim}>
              <boxGeometry args={[0.22, 0.07, 0.02]} />
            </mesh>
            <RoundedBox args={[0.17, 0.035, 0.035]} radius={0.012} position={[0, 0.005, s * 0.015]} material={m.chrome} />
          </group>
        )),
      )}
      {/* running boards */}
      {sides.map((s) => (
        <group key={s} position={[-0.1, 0.52, s * 1.02]}>
          <RoundedBox args={[2.4, 0.05, 0.2]} radius={0.015} material={m.trim} />
          {Array.from({ length: 12 }, (_, i) => -1.1 + i * 0.2).map((x) => (
            <mesh key={x} position={[x, 0.028, 0]} material={m.gloss}>
              <boxGeometry args={[0.1, 0.006, 0.16]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ================= hood ================= */}
      <RoundedBox args={[1.1, 0.08, 1.8]} radius={0.03} smoothness={4} position={[1.72, 1.42, 0]} material={m.paint} castShadow />
      {/* hood-top indicators */}
      {sides.map((s) => (
        <group key={s} position={[2.19, 1.49, s * 0.79]}>
          <RoundedBox args={[0.2, 0.06, 0.13]} radius={0.015} material={m.trim} />
          <mesh position={[0.02, 0.008, 0]} material={m.amber}>
            <boxGeometry args={[0.16, 0.05, 0.1]} />
          </mesh>
        </group>
      ))}
      {/* windshield base / wiper cowl */}
      <mesh position={[1.2, 1.4, 0]} material={m.gloss}>
        <boxGeometry args={[0.08, 0.05, 1.74]} />
      </mesh>
      {[-0.35, 0.35].map((z) => (
        <mesh key={z} position={[1.2, 1.44, z]} rotation={[0, 0.25, 0]} material={m.gloss}>
          <boxGeometry args={[0.01, 0.015, 0.6]} />
        </mesh>
      ))}

      {/* ================= greenhouse cage ================= */}
      <RoundedBox args={[3.5, 0.08, 1.82]} radius={0.03} smoothness={4} position={[-0.55, 1.92, 0]} material={m.paint} castShadow />
      {sides.map((s) => (
        <group key={s}>
          {/* header rail + sill */}
          <mesh position={[-0.55, 1.875, s * 0.885]} material={m.paint}>
            <boxGeometry args={[3.5, 0.05, 0.07]} />
          </mesh>
          <mesh position={[-0.55, 1.39, s * 0.885]} material={m.paint}>
            <boxGeometry args={[3.5, 0.04, 0.07]} />
          </mesh>
          {/* pillars A B C D */}
          {[1.16, -0.02, -1.28, -2.26].map((x) => (
            <mesh key={x} position={[x, 1.63, s * 0.885]} material={m.paint} castShadow>
              <boxGeometry args={[0.08, 0.5, 0.07]} />
            </mesh>
          ))}
          {/* side glass */}
          <mesh position={[-0.55, 1.63, s * 0.88]} material={m.glass}>
            <boxGeometry args={[3.4, 0.5, 0.012]} />
          </mesh>
        </group>
      ))}
      {/* windshield, rear glass, their frames */}
      <mesh position={[1.18, 1.63, 0]} material={m.glass}>
        <boxGeometry args={[0.012, 0.5, 1.76]} />
      </mesh>
      <mesh position={[-2.28, 1.63, 0]} material={m.glass}>
        <boxGeometry args={[0.012, 0.5, 1.76]} />
      </mesh>
      {[1.18, -2.28].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.875, 0]} material={m.paint}>
            <boxGeometry args={[0.07, 0.05, 1.8]} />
          </mesh>
          <mesh position={[x, 1.39, 0]} material={m.paint}>
            <boxGeometry args={[0.07, 0.04, 1.8]} />
          </mesh>
        </group>
      ))}
      {/* rear wiper */}
      <mesh position={[-2.295, 1.44, 0.2]} rotation={[0.6, 0, 0]} material={m.gloss}>
        <boxGeometry args={[0.012, 0.35, 0.02]} />
      </mesh>
      {/* roof rails */}
      {sides.map((s) => (
        <group key={s}>
          <RoundedBox args={[3.0, 0.045, 0.045]} radius={0.015} position={[-0.55, 2.0, s * 0.82]} material={m.trim} />
          {[-1.9, -0.55, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.975, s * 0.82]} material={m.trim}>
              <boxGeometry args={[0.1, 0.04, 0.045]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ================= interior ================= */}
      <mesh position={[-0.5, 0.63, 0]} material={m.carpet}>
        <boxGeometry args={[3.5, 0.02, 1.7]} />
      </mesh>
      {/* dashboard + MBUX widescreen + vents */}
      <RoundedBox args={[0.5, 0.32, 1.7]} radius={0.04} position={[0.95, 1.2, 0]} material={m.leather} />
      <mesh position={[1.1, 1.38, 0]} material={m.leather}>
        <boxGeometry args={[0.25, 0.04, 1.7]} />
      </mesh>
      <RoundedBox args={[0.03, 0.17, 0.95]} radius={0.01} position={[0.705, 1.33, 0.12]} material={m.gloss} />
      <mesh position={[0.69, 1.33, 0.12]} material={m.screen}>
        <boxGeometry args={[0.005, 0.15, 0.92]} />
      </mesh>
      {[-0.7, -0.2, 0.55, 0.75].map((z) => (
        <mesh key={z} position={[0.7, 1.14, z]} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
          <torusGeometry args={[0.035, 0.008, 8, 24]} />
        </mesh>
      ))}
      <mesh position={[0.72, 1.06, 0]} material={m.woodTrim}>
        <boxGeometry args={[0.02, 0.05, 1.5]} />
      </mesh>
      {/* steering wheel (driver on -Z) */}
      <group position={[0.55, 1.22, -0.42]} rotation={[0, 0, -0.35]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.leather}>
          <torusGeometry args={[0.19, 0.022, 12, 40]} />
        </mesh>
        <mesh material={m.leather}>
          <boxGeometry args={[0.02, 0.05, 0.36]} />
        </mesh>
        <mesh position={[0, -0.09, 0]} material={m.leather}>
          <boxGeometry args={[0.02, 0.18, 0.05]} />
        </mesh>
        <group rotation={[0, Math.PI / 2, 0]}>
          <MercedesStar radius={0.03} material={m.chrome} />
        </group>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.leather}>
          <cylinderGeometry args={[0.03, 0.03, 0.24, 12]} />
        </mesh>
      </group>
      {/* centre console */}
      <RoundedBox args={[1.0, 0.25, 0.3]} radius={0.03} position={[0.25, 0.78, 0]} material={m.leather} />
      <mesh position={[0.35, 0.91, 0]} material={m.woodTrim}>
        <boxGeometry args={[0.6, 0.01, 0.24]} />
      </mesh>
      {/* front seats */}
      {sides.map((s) => (
        <group key={s} position={[0.3, 0, s * -0.42]}>
          <RoundedBox args={[0.55, 0.2, 0.5]} radius={0.05} position={[0, 0.86, 0]} material={m.leatherRed} />
          <RoundedBox args={[0.12, 0.62, 0.5]} radius={0.05} position={[-0.26, 1.24, 0]} rotation={[0, 0, -0.14]} material={m.leatherRed} />
          <RoundedBox args={[0.1, 0.16, 0.28]} radius={0.03} position={[-0.32, 1.64, 0]} material={m.leather} />
          {/* seat side bolsters */}
          {[1, -1].map((b) => (
            <RoundedBox key={b} args={[0.5, 0.1, 0.06]} radius={0.02} position={[0, 0.93, b * 0.24]} material={m.leather} />
          ))}
        </group>
      ))}
      {/* rear bench */}
      <RoundedBox args={[0.55, 0.2, 1.5]} radius={0.05} position={[-1.05, 0.86, 0]} material={m.leatherRed} />
      <RoundedBox args={[0.12, 0.62, 1.5]} radius={0.05} position={[-1.32, 1.24, 0]} rotation={[0, 0, -0.14]} material={m.leatherRed} />
      {[-0.5, 0, 0.5].map((z) => (
        <RoundedBox key={z} args={[0.1, 0.16, 0.28]} radius={0.03} position={[-1.38, 1.64, z]} material={m.leather} />
      ))}
      {/* door cards */}
      {sides.map((s) => (
        <mesh key={s} position={[-0.55, 1.05, s * 0.9]} material={m.leather}>
          <boxGeometry args={[3.3, 0.6, 0.03]} />
        </mesh>
      ))}

      {/* ================= mirrors ================= */}
      {sides.map((s) => (
        <group key={s} position={[1.02, 1.5, s * 1.07]}>
          <mesh position={[0, -0.06, s * -0.12]} rotation={[s * 0.4, 0, 0]} material={m.trim}>
            <boxGeometry args={[0.05, 0.05, 0.16]} />
          </mesh>
          <RoundedBox args={[0.12, 0.16, 0.26]} radius={0.04} smoothness={4} material={m.paint} castShadow />
          <mesh position={[-0.062, 0, 0]} material={m.chrome}>
            <boxGeometry args={[0.004, 0.13, 0.22]} />
          </mesh>
        </group>
      ))}

      {/* ================= front end ================= */}
      {/* grille recess, chrome frame, vertical slats, star */}
      <mesh position={[2.285, 1.08, 0]} material={m.trim}>
        <boxGeometry args={[0.04, 0.42, 1.18]} />
      </mesh>
      {[1.29, 0.87].map((y) => (
        <mesh key={y} position={[2.305, y, 0]} material={m.chrome}>
          <boxGeometry args={[0.02, 0.03, 1.2]} />
        </mesh>
      ))}
      {[0.6, -0.6].map((z) => (
        <mesh key={z} position={[2.305, 1.08, z]} material={m.chrome}>
          <boxGeometry args={[0.02, 0.45, 0.03]} />
        </mesh>
      ))}
      {Array.from({ length: 13 }, (_, i) => -0.5 + i * 0.0833).map((z) => (
        <mesh key={z} position={[2.31, 1.08, z]} material={m.chrome}>
          <boxGeometry args={[0.02, 0.36, 0.022]} />
        </mesh>
      ))}
      <group position={[2.33, 1.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <MercedesStar radius={0.14} material={m.chrome} depth={0.03} />
      </group>
      {/* headlights */}
      {sides.map((s) => (
        <group key={s} position={[2.29, 1.1, s * 0.71]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={m.gloss}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 40]} />
          </mesh>
          <mesh position={[0.035, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
            <torusGeometry args={[0.195, 0.014, 10, 48]} />
          </mesh>
          <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.lamp}>
            <cylinderGeometry args={[0.085, 0.085, 0.03, 32]} />
          </mesh>
          <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.drl}>
            <torusGeometry args={[0.15, 0.011, 8, 48]} />
          </mesh>
          <mesh position={[0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.lensGlass}>
            <cylinderGeometry args={[0.185, 0.185, 0.01, 40]} />
          </mesh>
        </group>
      ))}
      {/* bumper: body, mesh insert, fog lamps, skid plate */}
      <RoundedBox args={[0.28, 0.3, 1.96]} radius={0.05} smoothness={4} position={[2.3, 0.6, 0]} material={m.trim} castShadow />
      <mesh position={[2.435, 0.55, 0]} material={m.gloss}>
        <boxGeometry args={[0.01, 0.12, 1.2]} />
      </mesh>
      {sides.map((s) => (
        <group key={s} position={[2.44, 0.62, s * 0.84]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={m.chrome}>
            <cylinderGeometry args={[0.065, 0.065, 0.01, 24]} />
          </mesh>
          <mesh position={[0, -0.006, 0]} material={m.lamp}>
            <cylinderGeometry args={[0.05, 0.05, 0.01, 24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[2.44, 0.47, 0]} material={m.chrome}>
        <boxGeometry args={[0.02, 0.05, 0.9]} />
      </mesh>

      {/* ================= rear end ================= */}
      <RoundedBox args={[0.28, 0.3, 1.96]} radius={0.05} smoothness={4} position={[-2.3, 0.6, 0]} material={m.trim} castShadow />
      <mesh position={[-2.44, 0.47, 0]} material={m.chrome}>
        <boxGeometry args={[0.02, 0.05, 0.9]} />
      </mesh>
      {sides.map((s) => (
        <group key={s} position={[-2.305, 1.17, s * 0.78]}>
          <RoundedBox args={[0.04, 0.3, 0.2]} radius={0.01} material={m.gloss} />
          <mesh position={[-0.012, 0.07, 0]} material={m.red}>
            <boxGeometry args={[0.03, 0.12, 0.16]} />
          </mesh>
          <mesh position={[-0.012, -0.03, 0]} material={m.amber}>
            <boxGeometry args={[0.03, 0.05, 0.16]} />
          </mesh>
          <mesh position={[-0.012, -0.095, 0]} material={m.lamp}>
            <boxGeometry args={[0.03, 0.05, 0.16]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-2.303, 1.0, -0.15]} material={m.gloss}>
        <boxGeometry args={[0.012, 0.7, 0.012]} />
      </mesh>
      {/* spare wheel on tailgate */}
      <RoundedBox args={[0.1, 0.55, 0.55]} radius={0.02} position={[-2.35, 1.1, 0.3]} material={m.trim} />
      <group position={[-2.47, 1.1, 0.3]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.tire} castShadow>
          <torusGeometry args={[0.3, 0.11, 16, 48]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.rim}>
          <cylinderGeometry args={[0.21, 0.21, 0.2, 32]} />
        </mesh>
        <mesh position={[-0.115, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.paint}>
          <cylinderGeometry args={[0.4, 0.4, 0.015, 48]} />
        </mesh>
        <mesh position={[-0.123, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
          <torusGeometry args={[0.4, 0.008, 8, 48]} />
        </mesh>
      </group>

      {/* ================= wheels ================= */}
      {wheels.map(([x, z]) => {
        const s = Math.sign(z);
        return (
          <group key={`wheel${x}${z}`} position={[x, WHEEL_Y, z]}>
            <mesh material={m.tire} castShadow>
              <torusGeometry args={[0.3, 0.11, 18, 56]} />
            </mesh>
            {/* barrel + dished face */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.rim}>
              <cylinderGeometry args={[0.215, 0.215, 0.2, 40]} />
            </mesh>
            <mesh position={[0, 0, s * 0.06]} rotation={[Math.PI / 2, 0, 0]} material={m.rimFace}>
              <cylinderGeometry args={[0.2, 0.2, 0.012, 40]} />
            </mesh>
            <mesh position={[0, 0, s * 0.1]} material={m.spoke}>
              <torusGeometry args={[0.21, 0.012, 8, 56]} />
            </mesh>
            {Array.from({ length: 10 }, (_, i) => (i * Math.PI * 2) / 10).map((a) => (
              <mesh
                key={a}
                position={[Math.cos(a) * 0.115, Math.sin(a) * 0.115, s * 0.09]}
                rotation={[0, 0, a]}
                material={m.spoke}
              >
                <boxGeometry args={[0.19, 0.032, 0.03]} />
              </mesh>
            ))}
            <mesh position={[0, 0, s * 0.1]} rotation={[Math.PI / 2, 0, 0]} material={m.rimFace}>
              <cylinderGeometry args={[0.055, 0.055, 0.02, 24]} />
            </mesh>
            {/* brake disc + AMG caliper */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.darkChrome}>
              <cylinderGeometry args={[0.185, 0.185, 0.03, 40]} />
            </mesh>
            <mesh position={[0.1, 0.1, s * 0.02]} rotation={[0, 0, Math.PI / 4]} material={m.caliper}>
              <boxGeometry args={[0.16, 0.06, 0.07]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
