import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-primary/30">
      <div className="w-full max-w-[380px] animate-fade-in-up">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-7 shadow-xl">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Reset your password
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Enter your work email to receive a password reset link.
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/50">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-white hover:underline font-medium transition-colors"
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
