import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-medium tracking-widest text-accent uppercase mb-3">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-6">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-4 rounded-sm bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Back to Merkato
        </Link>
      </div>
    </div>
  );
}
