import * as THREE from "three";

export function brandColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = (h % 360) / 360;
  const c = new THREE.Color().setHSL(hue, 0.72, 0.52);
  return `#${c.getHexString()}`;
}

export function readableTextColor(hex: string): string {
  const c = new THREE.Color(hex);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return lum > 0.45 ? "#0b0d12" : "#ffffff";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
