import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Point the DB at a throwaway SQLite file before the module graph loads.
const dir = mkdtempSync(path.join(tmpdir(), "buymecar-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;

const repo = await import("@/lib/repo");
const { SLOT_BY_ID } = await import("@/lib/slots-config");
const HOOD = SLOT_BY_ID.hood.startCents;
const ROOF = SLOT_BY_ID["roof-front"].startCents;

async function buy(slotId: string, brand: string, amountCents: number) {
  const id = `bid_${brand}_${amountCents}`;
  const res = await repo.createPendingBid(
    { slotId, brandName: brand, url: `https://${brand}.example`, email: `${brand}@example.com`, amountCents },
    id,
  );
  return { id, res };
}

describe("bid lifecycle", () => {
  beforeAll(async () => {
    await repo.getSlotViews();
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("seeds every slot as available at its opening price", async () => {
    const slots = await repo.getSlotViews();
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(s.owner).toBeNull();
      expect(s.minBidCents).toBe(s.startCents);
    }
  });

  it("rejects bids below the floor", async () => {
    const { res } = await buy("hood", "cheap", 100);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.minBidCents).toBe(HOOD);
  });

  it("a pending bid does not own the slot until paid", async () => {
    const { id, res } = await buy("hood", "acme", HOOD);
    expect(res.ok).toBe(true);
    let hood = (await repo.getSlotViews()).find((s) => s.id === "hood")!;
    expect(hood.owner).toBeNull();

    await repo.markBidPaid(id, "pay_1");
    hood = (await repo.getSlotViews()).find((s) => s.id === "hood")!;
    expect(hood.owner?.brandName).toBe("acme");
    expect(hood.minBidCents).toBe(Math.ceil(HOOD * 1.2));
  });

  it("a higher paid bid takes over and demotes the previous holder", async () => {
    const { id } = await buy("hood", "nova", Math.ceil(HOOD * 1.2));
    await repo.markBidPaid(id, "pay_2");

    const hood = (await repo.getSlotViews()).find((s) => s.id === "hood")!;
    expect(hood.owner?.brandName).toBe("nova");
    expect(hood.minBidCents).toBe(Math.ceil(Math.ceil(HOOD * 1.2) * 1.2));

    const old = await repo.getBid(`bid_acme_${HOOD}`);
    expect(old?.status).toBe("outbid");

    const stats = await repo.getStats();
    expect(stats.raisedCents).toBe(HOOD + Math.ceil(HOOD * 1.2));
    expect(stats.soldCount).toBe(1);
    expect(stats.takeovers).toBe(1);
  });

  it("replayed webhooks are idempotent", async () => {
    const before = await repo.getStats();
    await repo.markBidPaid(`bid_nova_${Math.ceil(HOOD * 1.2)}`, "pay_2");
    await repo.markBidPaid(`bid_nova_${Math.ceil(HOOD * 1.2)}`, "pay_2");
    const after = await repo.getStats();
    expect(after).toEqual(before);
  });

  it("failed payments never own anything", async () => {
    const { id } = await buy("roof-front", "flaky", ROOF);
    await repo.markBidFailed(id);
    const roof = (await repo.getSlotViews()).find((s) => s.id === "roof-front")!;
    expect(roof.owner).toBeNull();
    expect((await repo.getBid(id))?.status).toBe("failed");
  });
});
