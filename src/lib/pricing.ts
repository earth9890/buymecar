/** Outbid rule: at least +20% over the current holder, and never less than +$10. */
export const OUTBID_MULTIPLIER = 1.2;
export const MIN_INCREMENT_CENTS = 1000;

export function minBidCents(startCents: number, currentCents: number | null): number {
  if (currentCents == null) return startCents;
  return Math.max(
    Math.ceil(currentCents * OUTBID_MULTIPLIER),
    currentCents + MIN_INCREMENT_CENTS,
    startCents,
  );
}

export function goalCents(): number {
  const raw = Number(process.env.GOAL_CENTS ?? "18500000");
  return Number.isFinite(raw) && raw > 0 ? raw : 18500000;
}

export function formatUsd(cents: number, opts: { compact?: boolean } = {}): string {
  const dollars = cents / 100;
  // Hand-rolled compact form: Intl's compact notation differs between Node and
  // browsers ("$185.0K" vs "$185K") and breaks hydration.
  if (opts.compact && dollars >= 1000) {
    const units: [number, string][] = [
      [1_000_000_000, "B"],
      [1_000_000, "M"],
      [1_000, "K"],
    ];
    for (const [div, suffix] of units) {
      if (dollars >= div) {
        const v = dollars / div;
        const str = v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
        return `$${str}${suffix}`;
      }
    }
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}
