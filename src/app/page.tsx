import { BuyMeCarApp } from "@/components/BuyMeCarApp";
import { getSlotsPayload } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initial = await getSlotsPayload();
  return <BuyMeCarApp initial={initial} />;
}
