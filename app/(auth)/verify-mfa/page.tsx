import { MfaVerifyForm } from "@/components/auth/mfa-verify-form";

export default function VerifyMfaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-primary/30">
      <div className="w-full max-w-[380px] animate-fade-in-up">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-7 shadow-xl">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Two-factor verification
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <MfaVerifyForm />
        </div>
      </div>
    </div>
  );
}
