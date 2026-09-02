import * as THREE from "three";
import type { SlotView } from "@/lib/types";

/**
 * Projects each slot onto the real car surface: cast a ray from outside the
 * car along the slot's normal and place the decal a hair above the first hit.
 * Slots with no hit keep their configured position.
 */
export function snapSlotsToCar(
  car: THREE.Object3D,
  slots: SlotView[],
): Record<string, [number, number, number]> {
  car.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  const out: Record<string, [number, number, number]> = {};
  const normal = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const euler = new THREE.Euler();

  for (const s of slots) {
    euler.set(s.rotation[0], s.rotation[1], s.rotation[2]);
    normal.set(0, 0, 1).applyEuler(euler).normalize();
    const interior = s.zone === "interior";
    const standoff = interior ? 0.35 : 1.8;
    origin.set(s.position[0], s.position[1], s.position[2]).addScaledVector(normal, standoff);
    dir.copy(normal).negate();
    raycaster.set(origin, dir);
    raycaster.near = 0;
    raycaster.far = interior ? 0.7 : 3.6;
    const hits = raycaster.intersectObject(car, true);
    const hit = hits.find((h) => h.object.visible);
    if (!hit) continue;
    const p = hit.point.clone().addScaledVector(normal, 0.008);
    out[s.id] = [p.x, p.y, p.z];
  }
  return out;
}
