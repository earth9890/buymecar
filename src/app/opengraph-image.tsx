import { ImageResponse } from "next/og";
import { getStats, getSlotViews } from "@/lib/repo";
import { formatUsd } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "buymecar.lol — put your brand on a real Mercedes-AMG G63";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [stats, slots] = await Promise.all([getStats(), getSlotViews()]);
  const top = slots.filter((s) => s.owner).sort((a, b) => b.owner!.amountCents - a.owner!.amountCents).slice(0, 3);
  const hood = slots.find((s) => s.id === "hood");
  const pct = Math.min(100, (stats.raisedCents / stats.goalCents) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #07080b 0%, #0f1117 60%, #1a1508 100%)",
          color: "#f5f6f8",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f2b544", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a1206", fontSize: 24 }}>
              🚙
            </div>
            <div style={{ display: "flex" }}>
              <span>buymecar</span>
              <span style={{ color: "#8b8f98" }}>.lol</span>
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#8b8f98" }}>{`${stats.soldCount}/${stats.totalSlots} panels sponsored`}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            <div>Your brand on a real</div>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#f2b544" }}>Mercedes-AMG G63</span>
              <span>.</span>
            </div>
          </div>
          <div style={{ fontSize: 26, color: "#b6bac3", maxWidth: 900 }}>
            {`${stats.totalSlots} panels. Highest payer keeps the panel, anyone can outbid for 20% more.${hood ? ` The hood is ${formatUsd(hood.minBidCents)} right now.` : ""}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8b8f98" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "#f5f6f8", fontWeight: 700, fontSize: 30 }}>{formatUsd(stats.raisedCents)}</span>
                <span>raised</span>
              </div>
              <span>{`of ${formatUsd(stats.goalCents, { compact: true })}`}</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.12)", display: "flex" }}>
              <div style={{ width: `${Math.max(pct, 1)}%`, height: 12, borderRadius: 999, background: "#f2b544" }} />
            </div>
          </div>
          {top.length > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              {top.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", fontSize: 20 }}>
                  <span style={{ color: i === 0 ? "#f2b544" : "#8b8f98", fontWeight: 700 }}>{`#${i + 1}`}</span>
                  <span style={{ fontWeight: 600 }}>{s.owner!.brandName}</span>
                  <span style={{ color: "#8b8f98" }}>{formatUsd(s.owner!.amountCents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
