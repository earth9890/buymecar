import * as THREE from "three";
import type { SlotView } from "@/lib/types";

export interface SnappedPlacement {
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Projects each slot onto the real car surface. For every slot we cast a ray
 * from outside the car along the slot's configured normal; the decal is placed
 * a hair above the first hit and rotated to lie flush with the surface there
 * (keeping the configured "up" so text stays upright). Slots with no hit keep
 * their configured placement.
 */
export function snapSlotsToCar(
  car: THREE.Object3D,
  slots: SlotView[],
): Record<string, SnappedPlacement> {
  car.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  const out: Record<string, SnappedPlacement> = {};

  const normal = new THREE.Vector3();
  const up = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const euler = new THREE.Euler();
  const hitNormal = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up2 = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const normalMatrix = new THREE.Matrix3();
  const q = new THREE.Quaternion();

  for (const s of slots) {
    euler.set(s.rotation[0], s.rotation[1], s.rotation[2]);
    normal.set(0, 0, 1).applyEuler(euler).normalize();
    up.set(0, 1, 0).applyEuler(euler).normalize();

    const interior = s.zone === "interior";
    // Interior rays start from the far side of the cabin so they cross the seats/dash.
    const standoff = interior ? 0.95 : 1.8;
    origin.set(s.position[0], s.position[1], s.position[2]).addScaledVector(normal, standoff);
    dir.copy(normal).negate();
    raycaster.set(origin, dir);
    raycaster.near = 0;
    raycaster.far = interior ? 1.7 : 3.6;

    const hit = raycaster.intersectObject(car, true).find((h) => h.object.visible && h.face);
    if (!hit || !hit.face) continue;

    // World-space surface normal, flipped to face the same way as our ray came from.
    normalMatrix.getNormalMatrix(hit.object.matrixWorld);
    hitNormal.copy(hit.face.normal).applyMatrix3(normalMatrix).normalize();
    if (hitNormal.dot(normal) < 0) hitNormal.negate();

    // Only tilt onto the surface if it is broadly facing our way; otherwise keep
    // the configured orientation (we probably hit a bracket or an edge).
    const align = s.snap?.align ?? true;
    let rotation: [number, number, number] = s.rotation;
    if (align && hitNormal.dot(normal) > 0.5) {
      right.crossVectors(up, hitNormal).normalize();
      up2.crossVectors(hitNormal, right).normalize();
      basis.makeBasis(right, up2, hitNormal);
      q.setFromRotationMatrix(basis);
      euler.setFromQuaternion(q);
      rotation = [euler.x, euler.y, euler.z];
    } else {
      hitNormal.copy(normal);
    }

    const p = hit.point.clone().addScaledVector(hitNormal, s.snap?.offset ?? 0.01);
    out[s.id] = { position: [p.x, p.y, p.z], rotation };
  }
  return out;
}
