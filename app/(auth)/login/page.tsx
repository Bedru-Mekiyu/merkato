import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { oauthEnabled } from "@/lib/features";

const highlights = [
  "CRM, projects & support in one workspace",
  "Realtime team chat and activity feeds",
  "AI assistant that knows your business",
];

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="w-full max-w-sm mx-auto animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-sm shadow-indigo-500/40 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-lg font-semibold text-white">Merkato</span>
          </Link>

          <h1 className="text-3xl font-bold text-white tracking-tight mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-muted mb-8">
            Log in to your workspace to continue.
          </p>

          {oauthEnabled() && (
            <>
              <Suspense fallback={null}>
                <OAuthButtons />
              </Suspense>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-faint">or continue with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-sm text-muted text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-hover font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="hidden lg:flex bg-surface border-l border-border items-center justify-center p-16 relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />

        <div className="relative max-w-md w-full animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <ul className="space-y-4 mb-10">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-white/85">{item}</span>
              </li>
            ))}
          </ul>

          <figure className="rounded-lg border border-border bg-background/60 backdrop-blur p-6 shadow-modal">
            <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-warning" aria-hidden="true">
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-lg font-medium text-white leading-relaxed">
              &ldquo;Merkato replaced four separate tools for our team. Everything
              from leads to support tickets lives in one place now.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400/40 to-indigo-600/40 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm">
                H
              </div>
              <div>
                <p className="text-sm font-medium text-white">Hana Tesfaye</p>
                <p className="text-xs text-muted">Founder, Addis Labs</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
