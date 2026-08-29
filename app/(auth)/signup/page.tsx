import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { oauthEnabled } from "@/lib/features";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden selection:bg-primary/30">
      {/* Subtle Ambient Theme Aurora */}
      <div className="aurora opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
        <div className="rounded-2xl border border-white/[0.08] bg-surface/85 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
          <div className="mb-5">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Start your workspace with deals, tasks, and team chat.
            </p>
          </div>

          {oauthEnabled() && (
            <>
              <Suspense fallback={null}>
                <OAuthButtons />
              </Suspense>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                  or
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </>
          )}

          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>

          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/50">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
