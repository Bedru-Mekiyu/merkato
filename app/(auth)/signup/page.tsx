import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { oauthEnabled } from "@/lib/features";
import { Briefcase, KanbanSquare, LifeBuoy, Users } from "lucide-react";

const modules = [
  { icon: Briefcase, label: "CRM & deal pipeline" },
  { icon: KanbanSquare, label: "Projects with board, list & calendar" },
  { icon: Users, label: "Realtime team collaboration" },
  { icon: LifeBuoy, label: "Customer support portal" },
];

export default function SignupPage() {
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
            Create your account
          </h1>
          <p className="text-sm text-muted mb-8">
            Start running your startup from one workspace.
          </p>

          {oauthEnabled() && (
            <>
              <OAuthButtons />

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-faint">or sign up with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <SignupForm />

          <p className="mt-6 text-sm text-muted text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="hidden lg:flex bg-surface border-l border-border items-center justify-center p-16 relative overflow-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />

        <div className="relative max-w-md w-full animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <h2 className="text-2xl font-semibold text-white leading-snug mb-8">
            Every part of your startup,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              one clean workspace.
            </span>
          </h2>

          <ul className="space-y-3.5 mb-10">
            {modules.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-md border border-border bg-background/60 backdrop-blur px-4 py-3"
              >
                <span className="h-7 w-7 rounded-sm bg-accent/15 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                </span>
                <span className="text-sm text-white/85">{label}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-faint">
            Free to set up · No credit card · Your data stays in your workspace
          </p>
        </div>
      </div>
    </div>
  );
}
