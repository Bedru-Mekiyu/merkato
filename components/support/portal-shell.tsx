import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function PortalShell({
  orgName,
  orgSlug,
  children,
}: {
  orgName: string;
  orgSlug: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary/30">
      <header className="h-14 border-b border-white/[0.08] bg-surface/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-8">
        <Link href={`/portal/${orgSlug}`} className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-white tracking-tight">{orgName} Support Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Queue Active
        </span>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full animate-fade-in-up">{children}</main>

      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-xs text-white/40 flex items-center justify-center gap-1.5 font-mono">
        <LifeBuoy className="h-3.5 w-3.5 text-primary" />
        <span>Powered by Merkato Operating System</span>
      </footer>
    </div>
  );
}
