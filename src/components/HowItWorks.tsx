import { Car, Crosshair, CreditCard, Swords } from "lucide-react";

const STEPS = [
  { icon: Crosshair, title: "Pick a panel", body: "Spin the car, hover a price tag, click it. 35 spots from the hood to the headrests." },
  { icon: CreditCard, title: "Pay what it costs now", body: "Opening price if it's free, at least 20% more than the holder if it's taken. Card, Apple Pay, Google Pay via Dodo Payments." },
  { icon: Swords, title: "Hold it, or lose it", body: "Your brand goes on the car instantly and every click on that panel opens your link. Anyone can take it from you by paying 20% more. Take it back the same way." },
  { icon: Car, title: "I buy the actual car", body: "When the bar hits the price of a Mercedes-AMG G63, I buy it and wrap it exactly like this page. Receipts, photos and a video, posted here." },
];

const RULES = [
  "Being outbid is not a refund. You paid for the time you held the panel, and the total raised counts everyone who ever paid.",
  "Keep it clean. No adult content, gambling, crypto pumps, weapons, hate or anything illegal. I remove those without refund.",
  "Links must go where they say. Redirect chains, malware or bait-and-switch get pulled.",
  "Brand name up to 40 characters, tagline up to 60. Logos are optional and must be yours to use.",
  "Prices are in USD. Minimum takeover is 20% over the current holder, never less than $10.",
  "The car gets bought when the goal is reached, within 90 days, and every sponsor on the car at that moment goes on the real wrap.",
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        A public bidding war for the panels of one very specific Mercedes. Inspired by outbid.lol, except you get a car out of it.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <s.icon className="size-4" />
              </span>
              <span className="font-heading text-sm font-bold text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="font-heading text-lg font-bold">Rules</h3>
        <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
          {RULES.map((r) => (
            <li key={r} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
