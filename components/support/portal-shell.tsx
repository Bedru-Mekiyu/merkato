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
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center px-6">
        <Link href={`/portal/${orgSlug}`} className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-accent flex items-center justify-center text-white font-bold text-xs">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-white">{orgName} Support</span>
        </Link>
      </header>
      <main className="px-6 py-8 max-w-2xl mx-auto">{children}</main>
      <footer className="px-6 py-4 text-center text-xs text-faint flex items-center justify-center gap-1.5">
        <LifeBuoy className="h-3 w-3" />
        Powered by Merkato
      </footer>
    </div>
  );
}
