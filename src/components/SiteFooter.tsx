export function SiteFooter({ devMode }: { devMode: boolean }) {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-semibold text-foreground">buymecar.lol</span> · one guy, one G63, {" "}
          {devMode ? "payments simulated in dev mode" : "payments by Dodo Payments"}.
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="https://sketchfab.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            3D model via Sketchfab
          </a>
          <a href="https://outbid.lol" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Inspired by outbid.lol
          </a>
          <a href="#how" className="hover:text-foreground">
            Rules
          </a>
        </div>
      </div>
    </footer>
  );
}
