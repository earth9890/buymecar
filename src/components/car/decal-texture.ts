import * as THREE from "three";
import type { SlotView } from "@/lib/types";
import { formatUsd } from "@/lib/pricing";
import { brandColor, hostOf, readableTextColor } from "./materials";

const FONT = '"Geist", "Inter", -apple-system, "Helvetica Neue", Arial, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxH: number, weight = 700): number {
  let size = maxH;
  ctx.font = `${weight} ${size}px ${FONT}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) size = Math.floor(size * (maxW / w));
  return Math.max(6, size);
}

/**
 * Paints the vinyl for one slot. Available slots get a small price tag in the
 * middle of an otherwise clear panel (outline only on hover); owned slots get a
 * full-panel brand sticker in the brand colour.
 */
export function drawSlotTexture(slot: SlotView, hovered: boolean): THREE.CanvasTexture {
  const [w, h] = slot.size;
  const circle = slot.shape === "circle";
  const pxW = w >= 0.6 ? 1024 : w >= 0.3 ? 768 : 512;
  const pxH = Math.max(96, Math.round((pxW * h) / w));
  const canvas = document.createElement("canvas");
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, pxW, pxH);

  const owned = Boolean(slot.owner);
  const inset = Math.round(Math.min(pxW, pxH) * 0.03);
  const radius = Math.round(Math.min(pxW, pxH) * (circle ? 0.5 : 0.12));

  // Clip everything to the panel shape.
  ctx.save();
  if (circle) {
    ctx.beginPath();
    ctx.arc(pxW / 2, pxH / 2, Math.min(pxW, pxH) / 2 - inset, 0, Math.PI * 2);
    ctx.clip();
  } else {
    roundRect(ctx, inset, inset, pxW - inset * 2, pxH - inset * 2, radius);
    ctx.clip();
  }

  if (owned) {
    const color = brandColor(slot.owner!.brandName);
    const fg = readableTextColor(color);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, pxW, pxH);
    // subtle vinyl sheen + inner border
    const grad = ctx.createLinearGradient(0, 0, 0, pxH);
    grad.addColorStop(0, "rgba(255,255,255,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, pxW, pxH);
    ctx.strokeStyle = fg === "#ffffff" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)";
    ctx.lineWidth = Math.max(2, inset);
    if (circle) {
      ctx.beginPath();
      ctx.arc(pxW / 2, pxH / 2, Math.min(pxW, pxH) / 2 - inset * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      roundRect(ctx, inset * 1.5, inset * 1.5, pxW - inset * 3, pxH - inset * 3, radius);
      ctx.stroke();
    }

    const name = slot.owner!.brandName.toUpperCase();
    const sub = slot.owner!.tagline || hostOf(slot.owner!.url);
    const thin = h / w < 0.3;
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const usableW = (circle ? pxW * 0.68 : pxW * 0.86);
    if (thin) {
      const size = fitFont(ctx, name, usableW * 0.6, pxH * 0.55, 800);
      ctx.font = `800 ${size}px ${FONT}`;
      ctx.fillText(name, pxW * 0.35, pxH / 2);
      const s2 = fitFont(ctx, sub, usableW * 0.35, pxH * 0.36, 500);
      ctx.font = `500 ${s2}px ${FONT}`;
      ctx.globalAlpha = 0.85;
      ctx.fillText(sub, pxW * 0.76, pxH / 2);
      ctx.globalAlpha = 1;
    } else {
      const size = fitFont(ctx, name, usableW, pxH * (sub ? 0.3 : 0.4), 800);
      ctx.font = `800 ${size}px ${FONT}`;
      ctx.fillText(name, pxW / 2, pxH * (sub ? 0.44 : 0.5));
      if (sub) {
        const s2 = fitFont(ctx, sub, usableW, pxH * 0.14, 500);
        ctx.font = `500 ${s2}px ${FONT}`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(sub, pxW / 2, pxH * 0.44 + size * 0.75);
        ctx.globalAlpha = 1;
      }
    }
  } else {
    // Available: clear panel, faint tint on hover, price tag in the middle.
    if (hovered) {
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(0, 0, pxW, pxH);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = Math.max(3, inset * 1.5);
      ctx.setLineDash([inset * 4, inset * 3]);
      if (circle) {
        ctx.beginPath();
        ctx.arc(pxW / 2, pxH / 2, Math.min(pxW, pxH) / 2 - inset * 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        roundRect(ctx, inset * 2, inset * 2, pxW - inset * 4, pxH - inset * 4, radius);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fillRect(0, 0, pxW, pxH);
    }
    const price = formatUsd(slot.minBidCents);
    const thin = h / w < 0.3;
    const tagH = thin ? pxH * 0.78 : Math.min(pxH * 0.42, pxW * 0.22);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitFont(ctx, price, (circle ? pxW * 0.6 : pxW * 0.8), tagH * 0.62, 700);
    ctx.font = `700 ${size}px ${FONT}`;
    const textW = ctx.measureText(price).width;
    const tagW = textW + tagH * 0.9;
    const x = pxW / 2 - tagW / 2;
    const y = pxH / 2 - tagH / 2;
    ctx.fillStyle = hovered ? "rgba(255,255,255,0.96)" : "rgba(10,11,14,0.78)";
    roundRect(ctx, x, y, tagW, tagH, tagH / 2);
    ctx.fill();
    ctx.strokeStyle = hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(2, tagH * 0.05);
    roundRect(ctx, x, y, tagW, tagH, tagH / 2);
    ctx.stroke();
    ctx.fillStyle = hovered ? "#0a0b0e" : "#ffffff";
    ctx.fillText(price, pxW / 2, pxH / 2 + size * 0.04);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
