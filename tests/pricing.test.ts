import { describe, expect, it } from "vitest";
import { formatUsd, minBidCents } from "@/lib/pricing";

describe("minBidCents", () => {
  it("uses the opening price when nobody holds the slot", () => {
    expect(minBidCents(25000, null)).toBe(25000);
  });
  it("requires +20% over the current holder", () => {
    expect(minBidCents(25000, 50000)).toBe(60000);
  });
  it("never lets the increment fall below $10", () => {
    // 20% of $20 is $4, so the $10 floor wins.
    expect(minBidCents(1000, 2000)).toBe(3000);
  });
  it("never drops below the opening price", () => {
    expect(minBidCents(50000, 100)).toBe(50000);
  });
  it("rounds up fractional cents", () => {
    expect(minBidCents(1000, 12345)).toBe(14814);
  });
});

describe("formatUsd", () => {
  it("formats whole dollars without decimals", () => {
    expect(formatUsd(50000)).toBe("$500");
  });
  it("keeps cents when present", () => {
    expect(formatUsd(12345)).toBe("$123.45");
  });
  it("compacts thousands deterministically", () => {
    expect(formatUsd(18500000, { compact: true })).toBe("$185K");
    expect(formatUsd(150000, { compact: true })).toBe("$1.5K");
    expect(formatUsd(250000000, { compact: true })).toBe("$2.5M");
  });
});
