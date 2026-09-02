"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

export const CAR_LENGTH = 4.87;

interface Props {
  url: string;
  /** Called once the model is normalised and in the scene graph. */
  onLoaded?: (root: THREE.Object3D) => void;
}

/**
 * Loads a scanned G63 and normalises it into our coordinate frame:
 * car faces +X, ground at y = 0, centred on x/z, length = CAR_LENGTH.
 * Paint becomes satin black, glass is made cheap-transparent, shadows on.
 */
/**
 * Normalise a loaded scan in place. Idempotent: starts from a clean transform
 * every time, so React dev-mode double invocation is harmless.
 */
function normalizeScene(scene: THREE.Group): THREE.Group {
  scene.rotation.set(0, 0, 0);
  scene.scale.setScalar(1);
  scene.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);

  // 1. Which axis is the length? Rotate so it lies along X.
  let box = new THREE.Box3().setFromObject(scene);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) scene.rotation.y = Math.PI / 2;
  scene.updateMatrixWorld(true);

  // 2. Scale to real length, drop onto the floor, centre.
  box = new THREE.Box3().setFromObject(scene);
  size = box.getSize(new THREE.Vector3());
  const k = CAR_LENGTH / Math.max(size.x, 0.001);
  scene.scale.setScalar(k);
  scene.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(scene);
  let center = box.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -box.min.y, -center.z);
  scene.updateMatrixWorld(true);

  // 3. Which end is the front? The grille meshes tell us.
  const grille = new THREE.Box3();
  let grilleFound = false;
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((mm) => /grille/i.test(mm?.name ?? ""))) {
      grille.expandByObject(o);
      grilleFound = true;
    }
  });
  if (grilleFound && grille.getCenter(new THREE.Vector3()).x < 0) {
    scene.rotation.y += Math.PI;
    scene.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(scene);
    center = box.getCenter(new THREE.Vector3());
    scene.position.x -= center.x;
    scene.position.z -= center.z;
    scene.updateMatrixWorld(true);
  }

  // 4. Materials + shadows (safe to re-run).
  const seen = new Set<THREE.Material>();
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const mat of mats) {
      if (!mat || seen.has(mat)) continue;
      seen.add(mat);
      const name = mat.name ?? "";
      if (/paint/i.test(name) && mat instanceof THREE.MeshStandardMaterial) {
        mat.color.set("#0a0b0e");
        mat.metalness = 0.3;
        mat.roughness = 0.42;
        mat.envMapIntensity = 1.5;
        if (mat instanceof THREE.MeshPhysicalMaterial) {
          mat.clearcoat = 0.8;
          mat.clearcoatRoughness = 0.3;
        }
        mat.needsUpdate = true;
      }
      if (/window/i.test(name) && mat instanceof THREE.MeshPhysicalMaterial) {
        mat.transmission = 0;
        mat.transparent = true;
        mat.opacity = 0.38;
        mat.color.set("#0c1524");
        mat.roughness = 0.05;
        mat.metalness = 0.2;
        mat.side = THREE.DoubleSide;
        mat.depthWrite = false;
        mat.needsUpdate = true;
      }
      if (/_glass$/i.test(name) && mat instanceof THREE.MeshPhysicalMaterial) {
        mat.transmission = 0;
        mat.transparent = true;
        mat.opacity = 0.7;
        mat.emissive = mat.color.clone();
        mat.emissiveIntensity = 0.6;
        mat.needsUpdate = true;
      }
      if (/light/i.test(name) && mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive = new THREE.Color("#cfe0ff");
        mat.emissiveIntensity = 0.35;
        mat.needsUpdate = true;
      }
    }
  });
  return scene;
}

export function GltfCar({ url, onLoaded }: Props) {
  // Draco-compressed; decoder is served from /public/draco so nothing leaves our origin.
  const { scene } = useGLTF(url, "/draco/");

  const root = useMemo(() => normalizeScene(scene), [scene]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __car?: THREE.Object3D; __probe?: (o: number[], d: number[]) => number[] | null };
      w.__car = root;
      // Dev helper: raycast the car from the console to find real surface positions.
      w.__probe = (o, d) => {
        const rc = new THREE.Raycaster(new THREE.Vector3(...(o as [number, number, number])), new THREE.Vector3(...(d as [number, number, number])).normalize(), 0, 10);
        const h = rc.intersectObject(root, true).find((x) => x.object.visible);
        return h ? [h.point.x, h.point.y, h.point.z] : null;
      };
    }
    onLoaded?.(root);
  }, [root, onLoaded]);

  return <primitive object={root} />;
}

useGLTF.preload("/models/g63.glb", "/draco/");
