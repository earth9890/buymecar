import { brandColor, readableTextColor } from "@/components/car/materials";
import { cn } from "@/lib/utils";

export function BrandAvatar({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const bg = brandColor(name);
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={cn("rounded-xl bg-white object-contain p-1", className)} />
    );
  }
  return (
    <div
      className={cn("flex items-center justify-center rounded-xl font-bold", className)}
      style={{ background: bg, color: readableTextColor(bg) }}
    >
      {name.trim().slice(0, 1).toUpperCase()}
    </div>
  );
}
